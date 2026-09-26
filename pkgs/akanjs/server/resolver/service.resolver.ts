import type { PromiseOrObject } from "akanjs/base";
import { capitalize } from "akanjs/common";
import type { QueryOf } from "akanjs/constant";
import type {
  CRUDEventType,
  DatabaseModel,
  DataInputOf,
  Doc,
  DocumentUpdateInput,
  FindQueryOption,
  ListQueryOption,
  SaveEventType,
} from "akanjs/document";
import type { DatabaseService, ServiceCls } from "akanjs/service";
import type { CascadeRunner } from "./CascadeRunner";
import { DatabaseResolver } from "./database.resolver";

export class ServiceResolver {
  static #getDefaultDbServiceMethods(refName: string, className: string, cascade: CascadeRunner) {
    return {
      async __get(this: DatabaseService, id: string) {
        return await this.__databaseModel.__get(id);
      },
      async [`get${className}`](this: DatabaseService, id: string) {
        return this.__get(id);
      },
      async __load(this: DatabaseService, id?: string) {
        return await this.__databaseModel.__load(id);
      },
      async [`load${className}`](this: DatabaseService, id?: string) {
        return this.__load(id);
      },
      async __loadMany(this: DatabaseService, ids: string[]) {
        return await this.__databaseModel.__loadMany(ids);
      },
      async [`load${className}Many`](this: DatabaseService, ids: string[]) {
        return this.__loadMany(ids);
      },
      async __list(this: DatabaseService, query: QueryOf<any>, queryOption?: ListQueryOption) {
        return await this.__databaseModel.__list(query, queryOption);
      },
      async __listIds(this: DatabaseService, query: QueryOf<any>, queryOption?: ListQueryOption) {
        return await this.__databaseModel.__listIds(query, queryOption);
      },
      async __find(this: DatabaseService, query: QueryOf<any>, queryOption?: FindQueryOption) {
        return await this.__databaseModel.__find(query, queryOption);
      },
      async __findId(this: DatabaseService, query: QueryOf<any>, queryOption?: FindQueryOption) {
        return await this.__databaseModel.__findId(query, queryOption);
      },
      async __pick(this: DatabaseService, query: QueryOf<any>, queryOption?: FindQueryOption) {
        return await this.__databaseModel.__pick(query, queryOption);
      },
      async __pickId(this: DatabaseService, query: QueryOf<any>, queryOption?: FindQueryOption) {
        return await this.__databaseModel.__pickId(query, queryOption);
      },
      async __exists(this: DatabaseService, query: QueryOf<any>) {
        return await this.__databaseModel.__exists(query);
      },
      async __count(this: DatabaseService, query: QueryOf<any>) {
        return await this.__databaseModel.__count(query);
      },
      async __insight(this: DatabaseService, query: QueryOf<any>) {
        return await this.__databaseModel.__insight(query);
      },
      listenPre(
        this: DatabaseService,
        type: SaveEventType,
        listener: (doc: Doc, type: CRUDEventType, previous?: Doc) => PromiseOrObject<void>,
      ) {
        return this.__databaseModel.listenPre(type, listener);
      },
      listenPost(
        this: DatabaseService,
        type: SaveEventType,
        listener: (doc: Doc, type: CRUDEventType, previous?: Doc) => PromiseOrObject<void>,
      ) {
        return this.__databaseModel.listenPost(type, listener);
      },
      async __create(this: DatabaseService, data: DataInputOf) {
        const input = await this.__libsPreCreate(data);
        const doc = await this.__databaseModel.__create(input);
        return await this.__libsPostCreate(doc);
      },
      async [`create${className}`](this: DatabaseService, data: DataInputOf) {
        return this.__create(data);
      },
      async __update(this: DatabaseService, id: string, data: DataInputOf) {
        const input = await this.__libsPreUpdate(id, data);
        const doc = await this.__databaseModel.__update(id, input);
        return await this.__libsPostUpdate(doc);
      },
      async [`update${className}`](this: DatabaseService, id: string, data: DataInputOf) {
        return this.__update(id, data);
      },
      async __remove(this: DatabaseService, id: string): Promise<Doc> {
        await this.__libsPreRemove(id);
        const doc = await this.__databaseModel.__remove(id);
        const removed = await this.__libsPostRemove(doc);
        await cascade.run(refName, removed as Record<string, unknown>);
        return removed;
      },
      async [`remove${className}`](this: DatabaseService, id: string): Promise<Doc> {
        return this.__remove(id);
      },
      async __removeMany(this: DatabaseService, query: QueryOf<any>) {
        return await this.__databaseModel.__removeMany(query);
      },
      async __removeOne(this: DatabaseService, query: QueryOf<any>) {
        return await this.__databaseModel.__removeOne(query);
      },
      async __updateMany(this: DatabaseService, query: QueryOf<any>, update: DocumentUpdateInput) {
        return await this.__databaseModel.__updateMany(query, update);
      },
      async __updateOne(this: DatabaseService, query: QueryOf<any>, update: DocumentUpdateInput) {
        return await this.__databaseModel.__updateOne(query, update);
      },
    };
  }
  static resolveDatabaseService(database: DatabaseModel, srvRef: ServiceCls, cascade: CascadeRunner): ServiceCls {
    const className = capitalize(database.refName);
    Object.assign(srvRef.prototype, ServiceResolver.#getDefaultDbServiceMethods(database.refName, className, cascade));
    DatabaseResolver.applyFilterMethods(srvRef.prototype, database, className);
    return srvRef;
  }
}
