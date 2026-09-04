import type { NestedKeysWithAllowed } from "akanjs/base";
import { serve } from "akanjs/service";
import type * as cnst from "../cnst";
import * as db from "../db";
import { SummaryModel } from "./summary.document";

export class SummaryService extends serve(db.summary, () => ({})) {
  summary!: db.Summary;

  async makeSummary(archiveType: "periodic" | "non-periodic" = "non-periodic"): Promise<db.Summary> {
    const data = await this.summarize();
    return await this.summaryModel.archive(archiveType, data);
  }
  async summarize() {
    const keyValues = await Promise.all(
      SummaryModel.countedFields().map(async ([key, queryMeta]) => {
        const value = await this.summaryModel.countWithQuery(queryMeta.refName, SummaryModel.queryOf(key, queryMeta));
        return [key, value] as [string, number];
      }),
    );
    return Object.fromEntries(keyValues);
  }

  async moveValue(
    decField: NestedKeysWithAllowed<cnst.Summary, number>,
    incField: NestedKeysWithAllowed<cnst.Summary, number>,
    value = 1,
  ) {
    return await this.summaryModel.moveValue(decField, incField, value);
  }
  async incValue(field: NestedKeysWithAllowed<cnst.Summary, number>, value = 1) {
    return await this.summaryModel.incValue(field, value);
  }
  async decValue(field: NestedKeysWithAllowed<cnst.Summary, number>, value = 1) {
    return await this.summaryModel.decValue(field, value);
  }
  async setValue(field: NestedKeysWithAllowed<cnst.Summary, number>, value: number) {
    return await this.summaryModel.setValue(field, value);
  }
  async getActiveSummary() {
    this.summary =
      (await this.summaryModel.findByStatuses(["active"])) ??
      (await this.summaryModel.createSummary({ type: "non-periodic", status: "active" }));
    return this.summary;
  }
}
