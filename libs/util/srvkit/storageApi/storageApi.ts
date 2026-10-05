import { getEnv } from "akanjs/base";
import { adapt, BlobStorage } from "akanjs/service";
import type { ModulesOptions } from "../../lib/option";
import { BlobStorageApi } from "./blobStorageApi";
import { ObjectStorageApi } from "./objectStorageApi";
import type {
  CopyRequest,
  DownloadRequest,
  StorageBackend,
  UploadFromStreamRequest,
  UploadReadableStreamRequest,
  UploadRequest,
} from "./type";

export class StorageApi
  extends adapt("storageApi", ({ env, plug }) => ({
    // A closed-network kit has no route to the object store, and CI replaces an app's env file with its own, so the
    // deployment's STORAGE_MODE=local is what keeps its files on the local blob storage whatever the env configures.
    objectStorageOptions: env((options: ModulesOptions) =>
      process.env.STORAGE_MODE === "local" ? undefined : options.objectStorage,
    ),
    privateStorageOptions: env((options: ModulesOptions) =>
      process.env.STORAGE_MODE === "local" ? undefined : options.privateStorage,
    ),
    blobStorageApi: plug(BlobStorageApi),
  }))
  implements StorageBackend
{
  #storage: StorageBackend | null = null;
  #privateStorage: StorageBackend | null = null;

  override onInit() {
    if (!this.objectStorageOptions) BlobStorage.assertShared("Without `objectStorage`, libs/util storage");
  }

  get #backend(): StorageBackend {
    this.#storage ??= this.objectStorageOptions
      ? new ObjectStorageApi(getEnv().appName, this.objectStorageOptions)
      : this.blobStorageApi;
    return this.#storage;
  }

  // On R2/S3 access control is bucket-level (R2 ignores per-object ACL), so private files must live in a
  // separate bucket that has NO public access configured.
  get privateStorage(): StorageBackend {
    this.#privateStorage ??= this.privateStorageOptions
      ? new ObjectStorageApi(getEnv().appName, this.privateStorageOptions)
      : this;
    return this.#privateStorage;
  }

  get root() {
    return this.#backend.root;
  }
  get urlPrefix() {
    return this.#backend.urlPrefix;
  }
  readData(path: string) {
    return this.#backend.readData(path);
  }
  readReadyData(path: string) {
    return this.#backend.readReadyData(path);
  }
  readDataAsJson<T>(path: string) {
    return this.#backend.readDataAsJson<T>(path);
  }
  getDataList(prefix?: string) {
    return this.#backend.getDataList(prefix);
  }
  uploadDataFromLocal(request: UploadRequest) {
    return this.#backend.uploadDataFromLocal(request);
  }
  uploadDataFromStream(request: UploadFromStreamRequest) {
    this.#backend.uploadDataFromStream(request);
  }
  uploadDataFromReadableStream(request: UploadReadableStreamRequest) {
    return this.#backend.uploadDataFromReadableStream(request);
  }
  saveData(request: DownloadRequest) {
    return this.#backend.saveData(request);
  }
  copyData(request: CopyRequest) {
    return this.#backend.copyData(request);
  }
  deleteData(url: string) {
    return this.#backend.deleteData(url);
  }
  deleteDataByPath(path: string) {
    return this.#backend.deleteDataByPath(path);
  }
  presignUpload(path: string, expiresInSec: number) {
    return this.#backend.presignUpload(path, expiresInSec);
  }
  getDataSize(path: string) {
    return this.#backend.getDataSize(path);
  }
}
