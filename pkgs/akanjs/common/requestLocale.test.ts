import { describe, expect, test } from "bun:test";
import { RequestLocale } from "./requestLocale";

const i18n = { defaultLocale: "en", locales: ["en", "ko"] };

describe("RequestLocale", () => {
  test("takes the locale and path the proxy headers name", () => {
    expect(RequestLocale.resolve({ localeHeader: "ko", pathHeader: "/docs", pathname: "/en/other" }, i18n)).toEqual({
      locale: "ko",
      path: "/docs",
    });
  });

  test("reads a locale-prefixed URL when the proxy set nothing", () => {
    expect(RequestLocale.resolve({ pathname: "/ko/docs/intro" }, i18n)).toEqual({ locale: "ko", path: "/docs/intro" });
  });

  test("falls back to the default locale for a URL without a locale segment", () => {
    expect(RequestLocale.resolve({ pathname: "/docs" }, i18n)).toEqual({ locale: "en", path: "/docs" });
  });

  test("prefers a lone locale header over the URL's segment", () => {
    expect(RequestLocale.resolve({ localeHeader: "ko", pathname: "/en/docs" }, i18n)).toEqual({
      locale: "ko",
      path: "/docs",
    });
  });

  test("answers the default locale and the root outside a request", () => {
    expect(RequestLocale.resolve({}, i18n)).toEqual({ locale: "en", path: "/" });
    expect(RequestLocale.resolve({ localeHeader: "ko" }, i18n)).toEqual({ locale: "ko", path: "/" });
  });
});
