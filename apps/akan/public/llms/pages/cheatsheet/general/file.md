# File Management

- Source: /cheatsheet/general/file
- Mirror: /llms/pages/cheatsheet/general/file.md
- Section: cheatsheet
- Category: General
- Priority: P2

## Headings

- What You Build (#what-you-build)
- Minimal File Model (#minimal-model)
- Upload Endpoint (#upload-endpoint)
- File Service (#file-service)
- Use In UI (#use-in-ui)
- Auto-attach To A Model Field (#auto-field)
- Remove The File With Its Owner (#cascade)
- Grow Later (#grow-later)
- Tips (#tips)

## Content

File Management

The name the user picked, handed back as the download name.

The browser's type for the file, such as `image/png`.

Where storage serves the bytes, empty until the upload finishes.

The file size in bytes.

`uploading` while the bytes move, `active` once storage answers with a URL.

Upload progress from 0 to 100.

Not a field but an enum: the folder a file goes to, since it becomes part of the storage path.

Use the record id in the storage path, so filenames never collide.

Takes `(fileList, parentId?)` and posts the files, with `type` set to the model's name.

Takes `(fileList, index?)`, fills a File field of the form, and re-reads it every 3 s.

Form controls in `@libs/shared/ui` that call `add<Model>Files` for the `slice` you pass.

The files, in the order they were picked.

A JSON array with one `{ lastModifiedAt, size }` per file.

The owning model's name, such as `user`.

The id of the form being edited, left out when there is none.

Local disk

Object storage

What You Build

A file feature splits one upload in two. The bytes go to storage, and the database keeps a File record that says where they are.

Where

Minimal File Model

Start with only the fields your UI needs. Image size, a blur preview or the origin URL can come later.

Field

The constant file declares them, with the five classes every model has:

The service needs two writes on the model, one per progress tick and one when storage answers:

Upload Endpoint

Keep the endpoint boring. It takes the files and a purpose, and hands the real work to the service:

File Service

The service is the heart of the feature. For each file it does three things:

Use In UI

1. Upload and re-read in the store

One action uploads and keeps the record; the other refreshes it while it uploads:

2. Show it in a component

An image shows as a preview, and every file gets a download link:

Auto-attach To A Model Field

You get

The four fields

Remove The File With Its Owner

Grow Later

Start on local disk. Once the feature works, move to S3, R2 or MinIO by swapping the storage adaptor, not by rewriting the upload API.

Applying your own adaptor is one line in the app's option file:

Tips

## Code Examples

### apps/myapp/lib/file/file.constant.ts

```ts
import { enumOf, Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class FileStatus extends enumOf("fileStatus", ["uploading", "active"] as const) {}

export class FilePurpose extends enumOf("filePurpose", ["profile", "attachment"] as const) {}

export class FileInput extends via((field) => ({
  filename: field(String),
  mimetype: field(String),
  url: field(String, { default: "" }),
  size: field(Int, { default: 0 }),
})) {}

export class FileObject extends via(FileInput, (field) => ({
  status: field(FileStatus, { default: "uploading" }),
  progress: field(Int, { default: 0 }),
})) {}

export class LightFile extends via(
  FileObject,
  ["filename", "url", "size", "status"] as const,
  (resolve) => ({}),
) {}

export class File extends via(FileObject, LightFile, (resolve) => ({})) {}

export class FileInsight extends via(File, (field) => ({})) {}
```

### apps/myapp/lib/file/file.document.ts

```ts
import { by, from, into } from "akanjs/document";
import * as cnst from "../cnst";

export class FileFilter extends from(cnst.File, (filter) => ({
  query: {},
  sort: {},
})) {}

export class File extends by(cnst.File) {}

export class FileModel extends into(File, FileFilter, cnst.file, () => ({})) {
  async progressUpload(id: string, loaded: number | undefined, total: number) {
    const progress = Math.floor(((loaded ?? 0) / (total || 1)) * 100);
    await this.File.updateById(id, { progress });
  }
  async finishUpload(id: string, url: string) {
    await this.File.updateById(id, { url, progress: 100, status: "active" });
  }
}
```

### apps/myapp/lib/file/file.signal.ts

```ts
import { Admin, User } from "@libs/shared/srvkit";
import { Upload } from "akanjs/base";
import { endpoint, internal, None, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class FileInternal extends internal(srv.file, () => ({})) {}

export class FileSlice extends slice(
  srv.file,
  { guards: { root: Admin, get: User, cru: None } },
  () => ({}),
) {}

export class FileEndpoint extends endpoint(srv.file, ({ mutation }) => ({
  uploadFiles: mutation([cnst.File], { guards: [User] })
    .body("files", [Upload])
    .body("purpose", cnst.FilePurpose)
    .exec(async function (files, purpose) {
      return await this.fileService.uploadFiles(files, purpose);
    }),
})) {}
```

### apps/myapp/lib/file/file.service.ts

```ts
import { serve, StorageAdaptorRole } from "akanjs/service";

import * as db from "../db";

export class FileService extends serve(db.file, ({ plug }) => ({
  storage: plug(StorageAdaptorRole),
})) {
  async uploadFiles(files: File[], purpose: string) {
    return await Promise.all(files.map((file) => this.uploadFile(file, purpose)));
  }

  async uploadFile(file: File, purpose: string) {
    const record = await this.fileModel.createFile({
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      url: "",
      status: "uploading",
      progress: 0,
    });

    this.storage.uploadDataFromStream({
      path: `${purpose}/${record.id}`,
      body: file.stream(),
      mimetype: file.type,
      updateProgress: async ({ loaded }) => {
        await this.fileModel.progressUpload(record.id, loaded, file.size);
      },
      uploadSuccess: async (url) => {
        await this.fileModel.finishUpload(record.id, url);
      },
    });

    return record;
  }
}
```

### apps/myapp/lib/file/file.store.ts

```ts
import { store } from "akanjs/store";

import type * as cnst from "../cnst";
import { fetch, sig } from "../useClient";

export class FileStore extends store(sig.file, () => ({
  // state
  uploadedFile: null as cnst.File | null,
})) {
  // action
  async uploadProfileFile(fileList: FileList | File[]) {
    if (!fileList.length) return;
    const [file] = await fetch.uploadFiles(fileList, "profile");
    this.set({ uploadedFile: file ?? null });
  }
  async refreshUploadedFile() {
    const { uploadedFile } = this.get();
    if (uploadedFile?.status !== "uploading") return;
    this.set({ uploadedFile: await fetch.file(uploadedFile.id) });
  }
}
```

### apps/myapp/lib/file/File.Util.tsx

```ts
"use client";
import { st, usePage } from "@apps/myapp/client";
import { Image } from "akanjs/ui";
import { useInterval } from "akanjs/webkit";

export const Upload = () => {
  const { l } = usePage();
  const uploadedFile = st.use.uploadedFile();
  useInterval(st.do.refreshUploadedFile, 1000);
  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        onChange={(e) => void st.do.uploadProfileFile(e.target.files ?? [])}
      />
      {uploadedFile?.status === "active" ? (
        <>
          {uploadedFile.mimetype.startsWith("image/") ? (
            <Image src={uploadedFile.url} alt={uploadedFile.filename} />
          ) : null}
          <a href={uploadedFile.url} download={uploadedFile.filename}>
            {l.trans({ en: "Download", ko: "다운로드" })}
          </a>
        </>
      ) : null}
    </div>
  );
};
```

### apps/myapp/lib/file/file.signal.ts

```ts
import { Every } from "@libs/shared/srvkit";
import { dayjs, ID, Upload } from "akanjs/base";

export class FileEndpoint extends endpoint(srv.file, ({ mutation }) => ({
  addFiles: mutation([cnst.File], { guards: [Every], fileUpload: true, mcp: false })
    .body("files", [Upload])
    .body("metas", String, {
      example: `[{"lastModifiedAt":"2024-01-14T15:32:47.766Z","size":0}]`,
    })
    .body("type", String, { example: "user" })
    .body("parentId", ID, { nullable: true })
    .exec(async function (files, metas, type, parentId) {
      const rawMetas = JSON.parse(metas) as { lastModifiedAt: string; size: number }[];
      const parsedMetas = rawMetas.map((meta) => ({
        ...meta,
        lastModifiedAt: dayjs(meta.lastModifiedAt),
      }));
      return await this.fileService.addFiles(files, parsedMetas, type, parentId);
    }),
})) {}
```

### apps/myapp/lib/user/user.constant.ts

```ts
import { via } from "akanjs/constant";
import { File } from "../file/file.constant";

export class UserInput extends via((field) => ({
  nickname: field(String, { default: "" }),
  image: field(File, { cascade: "removeRef" }).optional(),
  images: field([File], { cascade: "removeRef" }),
})) {}
```

### apps/myapp/lib/file/file.service.ts

```ts
export class FileService extends serve(db.file, ({ plug }) => ({
  storage: plug(StorageAdaptorRole),
})) {
  override async _postRemove(file: db.File) {
    await this.storage.deleteData(file.url);
    return file;
  }
}
```

### apps/myapp/lib/option.ts

```ts
import { AkanOption } from "akanjs/server";
import { StorageAdaptorRole } from "akanjs/service";
import { S3Storage } from "../srvkit";
import type { LibOptions } from "./srv";

export type ModulesOptions = LibOptions & {
  [key: string]: unknown;
};

export const option = new AkanOption<ModulesOptions>()
  .applyAdaptor(StorageAdaptorRole, S3Storage);
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

