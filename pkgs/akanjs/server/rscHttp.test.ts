import { describe, expect, test } from "bun:test";
import { isRscPayloadResponse, RSC_CONTENT_TYPE } from "./rscHttp";

describe("RSC HTTP helpers", () => {
  test("allows normal RSC payload responses", () => {
    const response = new Response("flight", {
      status: 200,
      headers: { "Content-Type": RSC_CONTENT_TYPE },
    });

    expect(isRscPayloadResponse(response)).toBe(true);
  });

  test("allows not-found RSC payload responses", () => {
    const response = new Response("flight", {
      status: 404,
      headers: { "Content-Type": RSC_CONTENT_TYPE },
    });

    expect(isRscPayloadResponse(response)).toBe(true);
  });

  test("rejects non-RSC not-found responses", () => {
    const response = new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

    expect(isRscPayloadResponse(response)).toBe(false);
  });
});
