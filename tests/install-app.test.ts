import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { localizedManifest } from "../scripts/localized-manifest.mjs";
import {
  INSTALL_COOLDOWN_MS,
  INSTALL_VALUE_DELAY_MS,
  installExperience,
  isDismissed,
  isStandalone,
  shouldShowHomeOffer,
  shouldRegisterAppWorker,
} from "../lib/install-app";
import { publicAveragePaths, publicLandingPaths } from "../lib/i18n/public-routes";

test("calculator visits do not install the diary precache; app and landing still do", () => {
  for (const path of Object.values(publicAveragePaths)) {
    assert.equal(shouldRegisterAppWorker(path), false);
    assert.equal(shouldRegisterAppWorker(`${path}/`), false);
  }
  for (const path of [...Object.values(publicLandingPaths), "/app"]) {
    assert.equal(shouldRegisterAppWorker(path), true);
  }
  assert.equal(shouldRegisterAppWorker("/de/unknown-tool"), false);
  assert.equal(shouldRegisterAppWorker("/missing"), false);
});

const androidChrome = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36";
const samsung = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 SamsungBrowser/28.0 Chrome/130.0 Mobile Safari/537.36";
const firefox = "Mozilla/5.0 (Android 15; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0";
const edge = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 EdgA/130.0";
const iphoneSafari = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const desktopChrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";

test("Android Chromium uses the native prompt only after the browser offers it", () => {
  assert.equal(installExperience(androidChrome, true, false), "prompt");
  assert.equal(installExperience(androidChrome, false, false), "android-chrome");
});

test("Samsung Internet, Edge and Firefox have browser-specific manual fallbacks", () => {
  assert.equal(installExperience(samsung, false, false), "android-samsung");
  assert.equal(installExperience(samsung, true, false), "prompt");
  assert.equal(installExperience(firefox, false, false), "android-firefox");
  assert.equal(installExperience(edge, false, false), "android-edge");
});

test("Safari on iPhone and iPad gets the Share guide, not a fake prompt", () => {
  assert.equal(installExperience(iphoneSafari, false, false), "ios-safari");
  assert.equal(installExperience(iphoneSafari.replace("Safari/604.1", "CriOS/130.0 Safari/604.1"), false, false), "none");
  assert.equal(installExperience("Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/18.0 Safari/605.1", false, false, true), "ios-safari");
});

test("Desktop CTA requires a real install event; unknown browsers get none", () => {
  assert.equal(installExperience(desktopChrome, true, false), "prompt");
  assert.equal(installExperience(desktopChrome, false, false), "none");
  assert.equal(installExperience("UnknownBrowser/1.0", false, false), "none");
});

test("standalone and installed state suppress every installation invitation", () => {
  assert.equal(isStandalone((query) => query === "(display-mode: standalone)"), true);
  assert.equal(isStandalone(() => false, true), true);
  assert.equal(isStandalone(() => false), false);
  assert.equal(installExperience(androidChrome, true, true), "none");
  assert.equal(shouldShowHomeOffer("none", true, 60_000, null, 100_000), false);
});

test("Home offer waits for useful content and time, then respects 90-day dismissal", () => {
  const now = 200 * 24 * 60 * 60 * 1000;
  assert.equal(shouldShowHomeOffer("prompt", false, INSTALL_VALUE_DELAY_MS, null, now), false);
  assert.equal(shouldShowHomeOffer("prompt", true, INSTALL_VALUE_DELAY_MS - 1, null, now), false);
  assert.equal(shouldShowHomeOffer("prompt", true, INSTALL_VALUE_DELAY_MS, null, now), true);
  assert.equal(isDismissed(String(now - INSTALL_COOLDOWN_MS + 1), now), true);
  assert.equal(shouldShowHomeOffer("prompt", true, INSTALL_VALUE_DELAY_MS, String(now - 1), now), false);
  assert.equal(isDismissed(String(now - INSTALL_COOLDOWN_MS), now), false);
});

test("manifest points to the app, declares standalone and ships required icons", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/app?source=pwa");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  for (const icon of manifest.icons) {
    const bytes = readFileSync(new URL(`../public${icon.src}`, import.meta.url));
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    const size = Number(icon.sizes.split("x")[0]);
    assert.equal(view.getUint32(16), size);
    assert.equal(view.getUint32(20), size);
  }
  assert.ok(manifest.icons.some((icon: { purpose: string }) => icon.purpose === "maskable"));
});

test("localized public routes use the shared offline shell without four route precaches", () => {
  const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  const offline = readFileSync(new URL("../public/offline.html", import.meta.url), "utf8");
  assert.match(sw, /PUBLIC_LANDINGS = new Set\(\["\/it", "\/de", "\/fr", "\/en"\]\)/);
  assert.match(sw, /cache\.match\("\/offline\.html"\)/);
  assert.doesNotMatch(sw.match(/const CORE = \[([^\]]+)\]/)?.[1] ?? "", /"\/(it|de|fr|en)"/);
  assert.match(offline, /__OFFLINE_COPY__/);
  assert.match(offline, /ipagell-interface-locale-v1/);
});

test("localized manifests reuse catalog copy and the same installed app identity and assets", () => {
  const template = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const intlLocales = { it: "it-CH", de: "de-CH", fr: "fr-CH", en: "en-GB" };
  for (const locale of Object.keys(intlLocales) as Array<keyof typeof intlLocales>) {
    const messages = JSON.parse(readFileSync(new URL(`../lib/i18n/messages/${locale}.json`, import.meta.url), "utf8"));
    const manifest = localizedManifest(template, messages, locale, intlLocales[locale]);
    assert.equal(manifest.id, template.id);
    assert.equal(manifest.scope, template.scope);
    assert.deepEqual(manifest.icons, template.icons);
    assert.equal(manifest.lang, intlLocales[locale]);
    assert.equal(manifest.description, messages["landing.lead"]);
    assert.equal(manifest.start_url, `/app?source=pwa&uiLocale=${locale}`);
    assert.equal((manifest.shortcuts as Array<{ url: string }>)[0]?.url, `/app?action=grade&uiLocale=${locale}`);
  }
});
