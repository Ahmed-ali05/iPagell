import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import {
  CALLBACK_PATH, GOOGLE_ISSUER, authorizationUrl, exchangeCode, googleConfig,
  pkceChallenge, pkceVerifier, randomHandle, verifyIdToken,
} from "../lib/server/google-oidc";
import { HttpError } from "../lib/server/http";
import { NO_PASSWORD, verifyPassword } from "../lib/server/password";
import { apiErrorKey } from "../lib/i18n/errors";

const clientId = "synthetic-client.apps.googleusercontent.com";
const origin = "https://ipagell.website";
const values = { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: "synthetic-secret", GOOGLE_REDIRECT_URI: origin + CALLBACK_PATH };

async function keys() {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  return { privateKey, jwks: createLocalJWKSet({ keys: [jwk] }) };
}
async function token(privateKey: CryptoKey, claims: Record<string, unknown> = {}, options: { iss?: string; aud?: string; exp?: string; kid?: string } = {}) {
  return new SignJWT({ nonce: "n-1", azp: clientId, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: options.kid ?? "k1" })
    .setIssuer(options.iss ?? GOOGLE_ISSUER).setAudience(options.aud ?? clientId)
    .setSubject("109876543210").setIssuedAt().setExpirationTime(options.exp ?? "5m")
    .sign(privateKey);
}
const rejected = (error: unknown) => error instanceof HttpError && error.status === 401 && error.code === "AUTH_GOOGLE_FAILED";

test("Google is enabled only with a complete config whose callback is this exact origin", () => {
  assert.deepEqual(googleConfig(values, origin + "/api/auth/oauth/google/start"),
    { clientId, clientSecret: "synthetic-secret", redirectUri: origin + CALLBACK_PATH });
  assert.equal(googleConfig({ ...values, GOOGLE_CLIENT_SECRET: "" }, origin), null);
  assert.equal(googleConfig(values, "https://www.ipagell.website/app"), null, "other host");
  assert.equal(googleConfig({ ...values, GOOGLE_REDIRECT_URI: "http://ipagell.website" + CALLBACK_PATH }, "http://ipagell.website"), null, "plain http");
  assert.equal(googleConfig({ ...values, GOOGLE_REDIRECT_URI: origin + "/elsewhere" }, origin), null, "path");
  assert.equal(googleConfig({ ...values, GOOGLE_REDIRECT_URI: origin + CALLBACK_PATH + "?next=x" }, origin), null, "query");
  assert.ok(googleConfig({ ...values, GOOGLE_REDIRECT_URI: "http://localhost:5173" + CALLBACK_PATH }, "http://localhost:5173/"), "local dev");
});

test("authorization URL uses code flow, minimal scope, state, nonce and PKCE S256", async () => {
  const config = googleConfig(values, origin)!;
  const verifier = await pkceVerifier("b".repeat(64), "tx-1");
  assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(verifier, await pkceVerifier("b".repeat(64), "tx-1"), "recomputable from the browser binding");
  assert.notEqual(verifier, await pkceVerifier("c".repeat(64), "tx-1"), "bound to the browser");
  const url = new URL(await authorizationUrl(config, { state: "s", nonce: "n", verifier }));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  const p = url.searchParams;
  assert.deepEqual([p.get("response_type"), p.get("scope"), p.get("state"), p.get("nonce"), p.get("code_challenge_method"), p.get("redirect_uri")],
    ["code", "openid", "s", "n", "S256", origin + CALLBACK_PATH]);
  assert.equal(p.get("code_challenge"), await pkceChallenge(verifier));
  assert.equal(p.has("client_secret"), false);
});

test("reauth preselects the account with its subject; sign-in sends no hint", async () => {
  const config = googleConfig(values, origin)!;
  const verifier = await pkceVerifier("b".repeat(64), "tx-2");
  const plain = new URL(await authorizationUrl(config, { state: "s", nonce: "n", verifier })).searchParams;
  assert.equal(plain.has("login_hint"), false);
  const hinted = new URL(await authorizationUrl(config, { state: "s", nonce: "n", verifier, loginHint: "109876543210" })).searchParams;
  assert.equal(hinted.get("login_hint"), "109876543210");
  assert.equal(hinted.get("prompt"), "select_account", "the person still picks the account explicitly");
});

test("a valid ID token yields only the canonical issuer and subject", async () => {
  const { privateKey, jwks } = await keys();
  assert.deepEqual(await verifyIdToken(await token(privateKey, { email: "x@example.com" }), { clientId }, "n-1", jwks),
    { issuer: GOOGLE_ISSUER, subject: "109876543210" });
  assert.deepEqual(await verifyIdToken(await token(privateKey, {}, { iss: "accounts.google.com" }), { clientId }, "n-1", jwks),
    { issuer: GOOGLE_ISSUER, subject: "109876543210" }, "documented short issuer is canonicalized");
});

test("forged, replayed or mixed-up ID tokens are rejected", async () => {
  const { privateKey, jwks } = await keys();
  const other = await keys();
  const cases: [string, Promise<string>, string?][] = [
    ["wrong nonce (replay)", token(privateKey), "n-2"],
    ["wrong audience (mix-up)", token(privateKey, {}, { aud: "other-client" })],
    ["wrong issuer", token(privateKey, {}, { iss: "https://evil.example" })],
    ["expired", token(privateKey, {}, { exp: "-2h" })],
    ["foreign azp", token(privateKey, { azp: "other-client" })],
    ["signed by another key", token(other.privateKey)],
    ["unknown kid", token(privateKey, {}, { kid: "k2" })],
  ];
  for (const [label, signed, nonce] of cases)
    await assert.rejects(verifyIdToken(await signed, { clientId }, nonce ?? "n-1", jwks), rejected, label);
  const valid = await token(privateKey);
  const [header, payload] = valid.split(".");
  await assert.rejects(verifyIdToken(`${header}.${payload}.`, { clientId }, "n-1", jwks), rejected, "stripped signature");
  const none = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  await assert.rejects(verifyIdToken(`${none}.${payload}.`, { clientId }, "n-1", jwks), rejected, "alg none");
  const hs = await new SignJWT({ nonce: "n-1" }).setProtectedHeader({ alg: "HS256" }).setIssuer(GOOGLE_ISSUER)
    .setAudience(clientId).setSubject("1").setIssuedAt().setExpirationTime("5m").sign(new TextEncoder().encode("x".repeat(32)));
  await assert.rejects(verifyIdToken(hs, { clientId }, "n-1", jwks), rejected, "HS256");
});

test("code exchange sends the verifier and never trusts error bodies", async () => {
  const config = googleConfig(values, origin)!;
  let sent: URLSearchParams | null = null;
  const ok = (async (_url: string, init: RequestInit) => {
    sent = init.body as URLSearchParams;
    return Response.json({ id_token: "header.payload.signature", access_token: "ignored" });
  }) as unknown as typeof fetch;
  assert.equal(await exchangeCode(config, "code-1", "verifier-1", ok), "header.payload.signature");
  assert.equal(sent!.get("code_verifier"), "verifier-1");
  assert.equal(sent!.get("redirect_uri"), origin + CALLBACK_PATH);
  const failing = (async () => Response.json({ error: "invalid_grant", error_description: "secret detail" }, { status: 400 })) as unknown as typeof fetch;
  await assert.rejects(exchangeCode(config, "code-1", "v", failing), (e: unknown) => rejected(e) && !(e as Error).message.includes("secret detail"));
  const down = (async () => { throw new TypeError("network"); }) as unknown as typeof fetch;
  await assert.rejects(exchangeCode(config, "code-1", "v", down), (e: unknown) => e instanceof HttpError && e.status === 503);
});

test("handles are random, immutable-format and the no-password marker never verifies", async () => {
  const handles = new Set(Array.from({ length: 200 }, randomHandle));
  assert.equal(handles.size, 200);
  for (const handle of handles) assert.match(handle, /^u_[a-z2-7]{26}$/);
  assert.equal(await verifyPassword("", NO_PASSWORD), false);
  assert.equal(await verifyPassword("none$google", NO_PASSWORD), false);
  assert.equal(apiErrorKey("AUTH_GOOGLE_FAILED"), "auth.googleFailed");
  assert.equal(apiErrorKey("SECURITY_REAUTH_REQUIRED"), "security.reauthRequired");
  assert.equal(apiErrorKey("SECURITY_NO_PASSWORD"), "security.noPassword");
});
