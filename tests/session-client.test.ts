import test from "node:test";
import assert from "node:assert/strict";
import { clientCode } from "../lib/server/session-client";
import { parseClientCode } from "../lib/session-devices";
import { publicSessionId } from "../lib/server/session-repository";

const agents = {
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  chromeIos: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
  firefoxIos: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/132.0 Mobile/15E148 Safari/605.1.15",
  iosHomeScreen: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  ipadDesktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  chromeAndroid: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  samsung: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
  edgeWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  edgeAndroid: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 EdgA/131.0.0.0",
  operaWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
  chromeOs: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  chromeMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};
const code = (headers: Record<string, string>) => clientCode(new Headers(headers));

test("real User-Agents map to closed browser.system codes", () => {
  const expected: Record<keyof typeof agents, string> = {
    safariIphone: "safari.ios",
    chromeIos: "chrome.ios",
    firefoxIos: "firefox.ios",
    iosHomeScreen: "safari.ios",
    ipadDesktop: "safari.macos", // Known limit: iPadOS presents itself as a Mac.
    chromeAndroid: "chrome.android",
    samsung: "samsung.android",
    edgeWindows: "edge.windows",
    edgeAndroid: "edge.android",
    operaWindows: "opera.windows",
    firefoxLinux: "firefox.linux",
    chromeOs: "chrome.chromeos",
    chromeMac: "chrome.macos",
  };
  for (const [name, agent] of Object.entries(agents)) assert.equal(code({ "user-agent": agent }), expected[name as keyof typeof agents], name);
});

test("client hints win over the User-Agent, and work without it", () => {
  // Chromium's reduced User-Agent says "Windows"/"Android 10; K" generically.
  assert.equal(code({ "sec-ch-ua-platform": '"macOS"', "sec-ch-ua": '"Chromium";v="131", "Google Chrome";v="131", "Not_A Brand";v="24"', "user-agent": agents.edgeWindows }), "chrome.macos");
  assert.equal(code({ "sec-ch-ua-platform": '"Android"', "sec-ch-ua": '"Microsoft Edge";v="131", "Chromium";v="131"' }), "edge.android");
  assert.equal(code({ "sec-ch-ua-platform": '"Chrome OS"', "sec-ch-ua": '"Opera";v="115", "Chromium";v="130"' }), "opera.chromeos");
  assert.equal(code({ "sec-ch-ua-platform": '"Windows"', "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"', "user-agent": agents.operaWindows }), "opera.windows", "unlisted brand falls back to the User-Agent");
  assert.equal(code({ "sec-ch-ua-platform": '"Unknown"', "user-agent": agents.firefoxLinux }), "firefox.linux");
});

test("absent headers give null; odd values are never stored verbatim", () => {
  assert.equal(code({}), null);
  assert.equal(code({ "user-agent": "curl/8.7.1" }), "other.other");
  assert.equal(code({ "sec-ch-ua-platform": '"<script>alert(1)</script>"' }), "other.other");
  assert.equal(code({ "user-agent": `${"x".repeat(5000)} Firefox/1` }), "other.other", "only the first 512 characters are read");
  for (const headers of <Record<string, string>[]>[{ "user-agent": "Evil/1.0 (Windows; private@example.test)" }, { "sec-ch-ua": '"Brand<x>";v="1"', "sec-ch-ua-platform": '"FreeBSD"' }]) {
    const value = code(headers)!;
    assert.match(value, /^[a-z]+\.[a-z]+$/);
    assert.ok(parseClientCode(value) === null || value.split(".").every(Boolean));
  }
});

test("parseClientCode accepts only listed pairs", () => {
  assert.deepEqual(parseClientCode("chrome.android"), { browser: "chrome", system: "android" });
  assert.deepEqual(parseClientCode("other.ios"), { browser: "other", system: "ios" });
  for (const value of [null, "", "other.other", "chrome", "chrome.android.x", "netscape.android", "chrome.beos", "CHROME.ANDROID"])
    assert.equal(parseClientCode(value), null, String(value));
});

test("the public session id is stable, 32 hex and never the token hash", () => {
  const hash = "a".repeat(64);
  const id = publicSessionId(hash);
  assert.match(id, /^[a-f0-9]{32}$/);
  assert.equal(publicSessionId(hash), id);
  assert.notEqual(publicSessionId("b".repeat(64)), id);
  assert.equal(hash.includes(id), false);
});
