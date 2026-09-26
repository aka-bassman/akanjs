import fs from "node:fs";
import path from "node:path";
import type { SsrManifest, SsrManifestEntry } from "../ssrTypes";
import type { ClientManifest } from "./manifestTypes";

export interface RoutesManifest {
  routeIds: string[];
  clientManifest: ClientManifest;
  ssrManifest: SsrManifest;
  knownEntries: string[];
}

type SerializedRoutesManifest = Omit<RoutesManifest, "knownEntries"> & Partial<Pick<RoutesManifest, "knownEntries">>;

export class RoutesManifestStore {
  static serialize(manifest: RoutesManifest, artifactDir: string): RoutesManifest {
    const normalizedArtifactDir = path.resolve(artifactDir);
    return {
      ...manifest,
      clientManifest: RoutesManifestStore.#serializeClientManifest(manifest.clientManifest, normalizedArtifactDir),
      ssrManifest: RoutesManifestStore.#serializeSsrManifest(manifest.ssrManifest, normalizedArtifactDir),
      knownEntries: manifest.knownEntries.map((entry) =>
        RoutesManifestStore.#serializeArtifactPath(entry, normalizedArtifactDir),
      ),
    };
  }

  static async read(artifactDir: string): Promise<RoutesManifest | null> {
    const normalizedArtifactDir = path.resolve(artifactDir);
    const manifestPath = path.join(normalizedArtifactDir, "routes-manifest.json");
    const file = Bun.file(manifestPath);
    if (!(await file.exists())) return null;
    const json = (await file.json()) as unknown;
    if (!json || typeof json !== "object") return null;
    return RoutesManifestStore.normalize(json as SerializedRoutesManifest, normalizedArtifactDir);
  }

  static normalize(manifest: SerializedRoutesManifest, artifactDir: string): RoutesManifest {
    return {
      ...manifest,
      clientManifest: { ...manifest.clientManifest },
      ssrManifest: RoutesManifestStore.#normalizeSsrManifest(manifest.ssrManifest, artifactDir),
      knownEntries: (manifest.knownEntries ?? []).map((entry) =>
        RoutesManifestStore.#normalizeStoredPath(entry, artifactDir),
      ),
    };
  }

  static #serializeClientManifest(clientManifest: ClientManifest, artifactDir: string): ClientManifest {
    const serialized: ClientManifest = {};
    for (const [key, row] of Object.entries(clientManifest)) {
      serialized[RoutesManifestStore.#serializeArtifactPath(key, artifactDir)] = row;
    }
    return serialized;
  }

  static #serializeSsrManifest(ssrManifest: SsrManifest, artifactDir: string): SsrManifest {
    const moduleMap: SsrManifest["moduleMap"] = {};
    for (const [entryUrl, byName] of Object.entries(ssrManifest.moduleMap)) {
      const serializedByName: Record<string, SsrManifestEntry> = {};
      for (const [name, entry] of Object.entries(byName)) {
        serializedByName[name] = {
          ...entry,
          id: RoutesManifestStore.#serializeArtifactPath(entry.id, artifactDir),
          chunks: entry.chunks.map((chunk) => RoutesManifestStore.#serializeArtifactPath(chunk, artifactDir)),
        };
      }
      moduleMap[entryUrl] = serializedByName;
    }
    return { ...ssrManifest, moduleMap };
  }

  static #normalizeSsrManifest(ssrManifest: SsrManifest, artifactDir: string): SsrManifest {
    const moduleMap: SsrManifest["moduleMap"] = {};
    for (const [entryUrl, byName] of Object.entries(ssrManifest.moduleMap)) {
      const normalizedByName: Record<string, SsrManifestEntry> = {};
      for (const [name, entry] of Object.entries(byName)) {
        normalizedByName[name] = {
          ...entry,
          id: RoutesManifestStore.#normalizeArtifactPath(entry.id, artifactDir),
          chunks: entry.chunks.map((chunk) => RoutesManifestStore.#normalizeArtifactPath(chunk, artifactDir)),
        };
      }
      moduleMap[entryUrl] = normalizedByName;
    }
    return { ...ssrManifest, moduleMap };
  }

  static #serializeArtifactPath(artifactPath: string, artifactDir: string): string {
    if (!path.isAbsolute(artifactPath)) return artifactPath;
    return path.relative(artifactDir, artifactPath).split(path.sep).join("/");
  }

  static #normalizeStoredPath(storedPath: string, artifactDir: string): string {
    if (path.isAbsolute(storedPath)) return storedPath;
    return path.resolve(artifactDir, storedPath);
  }

  static #normalizeArtifactPath(artifactPath: string, artifactDir: string): string {
    if (!path.isAbsolute(artifactPath)) return path.resolve(artifactDir, artifactPath);
    if (fs.existsSync(artifactPath)) return artifactPath;

    const marker = `${path.sep}.akan${path.sep}artifact${path.sep}`;
    const markerIndex = artifactPath.lastIndexOf(marker);
    if (markerIndex >= 0) {
      const rel = artifactPath.slice(markerIndex + marker.length);
      return path.resolve(artifactDir, rel);
    }

    return path.resolve(artifactDir, "client", path.basename(artifactPath));
  }
}
