import type { QueryMeta } from "@libs/shared/common";
import { type Cls, dayjs, FIELD_META, Float, Int, type NestedKeysWithAllowed } from "akanjs/base";
import { ConstantRegistry, type QueryOf } from "akanjs/constant";
import {
  by,
  DatabaseRegistry,
  DocumentSchema,
  documentQueryHelper,
  fillMissingFilterArgs,
  from,
  getFilterInfoByKey,
  into,
} from "akanjs/document";
import type { DatabaseAdaptor } from "akanjs/service";
import * as cnst from "../cnst";
import type * as db from "../db";
import { Err } from "../dict";

export class SummaryFilter extends from(cnst.Summary, (filter) => ({
  query: {
    byStatuses: filter()
      .opt("statuses", [cnst.SummaryStatus])
      .query((statuses, q) => (statuses?.length ? { status: q.oneOf(statuses) } : {})),
    toPeriod: filter()
      .arg("from", Date)
      .arg("to", Date)
      .opt("periodTypes", [cnst.PeriodType])
      .query((from, to, periodTypes, q) => ({
        at: q.between(from.toDate(), to.toDate()),
        type: q.oneOf(periodTypes ?? ["hourly"]),
      })),
  },
  sort: {
    oldestAt: { at: 1 },
  },
})) {}

export class Summary extends by(cnst.Summary) {}

export class SummaryModel extends into(Summary, SummaryFilter, cnst.summary, () => ({})) {
  static countedFields(): [string, QueryMeta][] {
    return Object.entries(cnst.Summary[FIELD_META])
      .filter(([_, field]) => !!field.meta.queryKey)
      .filter(([_, field]) => (field.modelRef as Cls) === Int || (field.modelRef as Cls) === Float)
      .map(([key, field]) => [key, field.meta as QueryMeta]);
  }
  static queryOf(key: string, queryMeta: QueryMeta): QueryOf<unknown> {
    const queryKey = queryMeta.queryKey;
    if (!queryKey) throw new Err("summary.error.queryKeyNotDefined", { key });
    const filterRef = DatabaseRegistry.getDatabase(queryMeta.refName).filter;
    const filterInfo = getFilterInfoByKey(filterRef, queryKey);
    if (!filterInfo.queryFn) throw new Err("summary.error.queryFnNotDefined", { key });
    const args = queryMeta.queryArgs;
    const buildQuery = filterInfo.queryFn as (...args: unknown[]) => QueryOf<unknown>;
    return buildQuery(
      ...fillMissingFilterArgs(filterInfo, typeof args === "function" ? args() : args),
      documentQueryHelper,
    );
  }
  async archive(archiveType: "periodic" | "non-periodic", data: Omit<db.SummaryInput, "type">) {
    const [type, at] = cnst.Summary.getPeriodicType();
    const periodAt = dayjs(at);
    if ((await this.Summary.countDocuments({ status: "active" })) > 1) {
      const summary = await this.Summary.pickOne({ status: "active" });
      const q = documentQueryHelper;
      await this.Summary.removeMany(q.all({ status: "active" }, { id: q.ne(summary.id) }));
    }
    const active = await this.Summary.findOne({ status: "active", type: "active" });
    await (active
      ? active.set({ ...data, at: periodAt, status: "active" }).save()
      : new this.Summary({ ...data, type: "active", at: periodAt, status: "active" }).save());
    if (archiveType === "non-periodic") return await new this.Summary(data).save();
    const archived = await this.Summary.findOne({ status: "archived", type, at: periodAt });
    return await (archived
      ? archived.set({ ...data, at: periodAt, status: "archived" }).save()
      : new this.Summary({ ...data, type, at: periodAt, status: "archived" }).save());
  }
  async moveValue(
    decField: NestedKeysWithAllowed<cnst.Summary, number>,
    incField: NestedKeysWithAllowed<cnst.Summary, number>,
    value = 1,
  ) {
    const { modifiedCount } = await this.Summary.updateOne({ status: "active" }, ({ inc }) => ({
      [decField]: inc(-value),
      [incField]: inc(value),
    }));
    return !!modifiedCount;
  }
  async incValue(field: NestedKeysWithAllowed<cnst.Summary, number>, value = 1) {
    const { modifiedCount } = await this.Summary.updateOne({ status: "active" }, ({ inc }) => ({
      [field]: inc(value),
    }));
    return !!modifiedCount;
  }
  async decValue(field: NestedKeysWithAllowed<cnst.Summary, number>, value = 1) {
    const { modifiedCount } = await this.Summary.updateOne({ status: "active" }, ({ inc }) => ({
      [field]: inc(value),
    }));
    return !!modifiedCount;
  }
  async setValue(field: NestedKeysWithAllowed<cnst.Summary, number>, value: number) {
    const { modifiedCount } = await this.Summary.updateOne({ status: "active" }, { [field]: value });
    return !!modifiedCount;
  }
  async countWithQuery(refName: string, query: QueryOf<unknown>) {
    const database = DatabaseRegistry.getDatabase(refName);
    const schema = new DocumentSchema();
    database.model._onSchema(schema);
    database.model._libsOnSchema(schema);
    const { __database } = this as unknown as { __database: DatabaseAdaptor };
    const store = __database.getStore(ConstantRegistry.getDatabase(refName), database, schema);
    return await store.count(query);
  }
}
