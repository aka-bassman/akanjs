import type { RoutesManifest } from "akanjs/server";
import { RoutesManifestStore } from "akanjs/server/artifact/routesManifestStore";

export type SerializedRoutesManifest = Omit<RoutesManifest, "knownEntries"> &
  Partial<Pick<RoutesManifest, "knownEntries">>;

export class RoutesManifestArtifactSerializer {
  #manifest: RoutesManifest;
  #artifactDir: string;
  #production: boolean;

  constructor(manifest: RoutesManifest, artifactDir: string, options: { production?: boolean } = {}) {
    this.#manifest = manifest;
    this.#artifactDir = artifactDir;
    this.#production = options.production ?? false;
  }

  static serialize(
    manifest: RoutesManifest,
    artifactDir: string,
    options: { production?: boolean } = {},
  ): SerializedRoutesManifest {
    return new RoutesManifestArtifactSerializer(manifest, artifactDir, options).serialize();
  }

  serialize(): SerializedRoutesManifest {
    const serialized: SerializedRoutesManifest = RoutesManifestStore.serialize(this.#manifest, this.#artifactDir);
    if (this.#production) delete serialized.knownEntries;
    return serialized;
  }
}
