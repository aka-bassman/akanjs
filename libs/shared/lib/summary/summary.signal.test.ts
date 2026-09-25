import { describe, expect, it } from "bun:test";
import "../cnst";
import "../db";
import { SummaryModel } from "./summary.document";

describe("Summary Signal", () => {
  describe("Summary Model", () => {
    it("declares a counted field for every user metric on the dashboard", () => {
      const keys = SummaryModel.countedFields().map(([key]) => key);

      expect(keys).toContain("activeUser");
      expect(keys).toContain("hau");
      expect(keys).toContain("dau");
      expect(keys).toContain("wau");
      expect(keys).toContain("mau");
    });
    it("builds a real query for every counted field", () => {
      for (const [key, queryMeta] of SummaryModel.countedFields()) {
        const query = SummaryModel.queryOf(key, queryMeta);

        expect(query, key).toBeObject();
        expect(Object.keys(query as object).length, key).toBeGreaterThan(0);
      }
    });
    it("narrows a status count to the status the field asked for", () => {
      const [, activeUser] = SummaryModel.countedFields().find(([key]) => key === "activeUser") ?? [];
      if (!activeUser) throw new Error("activeUser is not a counted field");

      expect(SummaryModel.queryOf("activeUser", activeUser)).toHaveProperty("status");
    });
    it("narrows an active-user window to a login cutoff", () => {
      const [, dau] = SummaryModel.countedFields().find(([key]) => key === "dau") ?? [];
      if (!dau) throw new Error("dau is not a counted field");

      expect(SummaryModel.queryOf("dau", dau)).toHaveProperty("lastLoginAt");
    });
  });
});
