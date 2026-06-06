import type { SerializedSignal } from "./types";

/**
 * Framework-owned file-upload contract. A plugin opts in by marking exactly one
 * upload mutation with `{ fileUpload: true }`; the multipart form must use these
 * field names and the metas shape below.
 */
export const fileUploadContract = {
  fields: { files: "files", metas: "metas", type: "type", parentId: "parentId" },
  buildMetas: (fileList: FileList) =>
    Array.from(fileList).map((f) => ({ lastModifiedAt: new Date(f.lastModified).toISOString(), size: f.size })),
} as const;

export interface FileUploadCapability {
  refName: string;
  endpointKey: string;
  prefix?: string;
}

/** Discovers the upload endpoint marked with `{ fileUpload: true }` from the serialized signal. */
export const resolveFileUploadCapability = (serializedSignal: {
  [key: string]: SerializedSignal;
}): FileUploadCapability | null => {
  const matches: FileUploadCapability[] = [];
  for (const [refName, signal] of Object.entries(serializedSignal))
    for (const [endpointKey, endpoint] of Object.entries(signal.endpoint))
      if (endpoint.fileUpload) matches.push({ refName, endpointKey, prefix: signal.prefix });
  if (matches.length > 1)
    console.warn(
      `[akan] Multiple fileUpload endpoints found (${matches
        .map((m) => `${m.refName}.${m.endpointKey}`)
        .join(", ")}). Using the first; mark only one mutation with { fileUpload: true }.`,
    );
  return matches[0] ?? null;
};
