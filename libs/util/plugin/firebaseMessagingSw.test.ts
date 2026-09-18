import { describe, expect, test } from "bun:test";
import { pushNavigateMessage } from "../common/pushNavigateMessage";
import {
  createFirebaseMessagingServiceWorker,
  generatedServiceWorkerBanner,
  normalizeFirebaseClientConfig,
} from "./firebaseMessagingSw";

const configOf = () =>
  normalizeFirebaseClientConfig({
    apiKey: "public-api-key",
    projectId: "public-project",
    messagingSenderId: "1234567890",
    appId: "public-app-id",
  });

describe("normalizeFirebaseClientConfig", () => {
  test("whitelists client fields and drops secrets / vapidKey", () => {
    const normalized = normalizeFirebaseClientConfig({
      apiKey: "public-api-key",
      authDomain: "example.firebaseapp.com",
      projectId: "public-project",
      storageBucket: "public-project.appspot.com",
      messagingSenderId: "1234567890",
      appId: "public-app-id",
      vapidKey: "public-vapid-key",
      private_key: "SERVER_PRIVATE_KEY_MUST_NOT_LEAK",
    });
    expect(normalized).toEqual({
      apiKey: "public-api-key",
      authDomain: "example.firebaseapp.com",
      projectId: "public-project",
      storageBucket: "public-project.appspot.com",
      messagingSenderId: "1234567890",
      appId: "public-app-id",
    });
    expect(normalized).not.toHaveProperty("vapidKey");
    expect(normalized).not.toHaveProperty("private_key");
  });

  test("returns null when required fields are missing or input is not an object", () => {
    expect(normalizeFirebaseClientConfig(undefined)).toBe(null);
    expect(normalizeFirebaseClientConfig(null)).toBe(null);
    expect(normalizeFirebaseClientConfig("nope")).toBe(null);
    expect(normalizeFirebaseClientConfig({ apiKey: "only-key" })).toBe(null);
  });
});

describe("createFirebaseMessagingServiceWorker", () => {
  test("inlines client config and imports firebase compat SDK, without leaking secrets", () => {
    const config = normalizeFirebaseClientConfig({
      apiKey: "public-api-key",
      projectId: "public-project",
      messagingSenderId: "1234567890",
      appId: "public-app-id",
      private_key: "SERVER_PRIVATE_KEY_MUST_NOT_LEAK",
    });
    const body = createFirebaseMessagingServiceWorker(config);
    expect(body).toContain("public-api-key");
    expect(body).toContain("public-project");
    expect(body).toContain("firebase-messaging-compat.js");
    expect(body).toContain("onBackgroundMessage");
    expect(body).toContain("notificationclick");
    expect(body).not.toContain("SERVER_PRIVATE_KEY_MUST_NOT_LEAK");
    expect(body).not.toContain("private_key");
  });

  test("produces a no-op worker (config null) that still registers notificationclick", () => {
    const body = createFirebaseMessagingServiceWorker(null);
    // config is null → the importScripts/onBackgroundMessage block is gated by `if (firebaseConfig)` at runtime,
    // but notificationclick is always registered.
    expect(body).toContain("const firebaseConfig = null");
    expect(body).toContain("notificationclick");
    expect(body).toContain("if (firebaseConfig)");
  });

  test("emits syntactically valid JavaScript", () => {
    // The worker is a template literal, so an unescaped `${}` inside it is a generator bug that only ever
    // surfaces as a service worker the browser silently refuses to install.
    expect(() => new Function(createFirebaseMessagingServiceWorker(configOf()))).not.toThrow();
  });

  test("opens with the banner the sync step matches on to decide whether to regenerate", () => {
    expect(createFirebaseMessagingServiceWorker(configOf()).startsWith(generatedServiceWorkerBanner)).toBe(true);
  });

  test("activates immediately instead of waiting for the visit after next", () => {
    const body = createFirebaseMessagingServiceWorker(configOf());
    expect(body).toContain("self.skipWaiting()");
    expect(body).toContain("self.clients.claim()");
  });

  test("leaves a payload carrying a notification block to the SDK, so one push is one notification", () => {
    const body = createFirebaseMessagingServiceWorker(configOf());
    expect(body).toContain("if (payload?.notification) return;");
    const handler = body.slice(body.indexOf("onBackgroundMessage"), body.indexOf("notificationclick"));
    expect(handler.indexOf("if (payload?.notification) return;")).toBeLessThan(handler.indexOf("showNotification"));
  });

  test("reuses an open tab on click and hands the route over, rather than opening a second one", () => {
    const body = createFirebaseMessagingServiceWorker(configOf());
    expect(body).toContain("self.clients.matchAll(");
    expect(body).toContain("existing.focus()");
    expect(body).toContain(`type: "${pushNavigateMessage}"`);
    expect(body).toContain("self.clients.openWindow(target.href)");
  });

  test("applies a badge count only where setAppBadge exists", () => {
    const body = createFirebaseMessagingServiceWorker(configOf());
    expect(body).toContain("applyBadge(payload?.data?.badgeCount)");
    expect(body).toContain("!navigator.setAppBadge");
  });
});
