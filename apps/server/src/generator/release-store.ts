import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { SiteSpecification } from "@where-they-are/contracts";

export type SiteRelease = {
  releaseId: string;
  previewSlug: string;
  specification: SiteSpecification;
  html: string;
};

export class ReleaseStore {
  public constructor(private readonly rootDirectory = join(process.cwd(), "data", "releases")) {}

  public async save(release: SiteRelease): Promise<void> {
    const releaseDirectory = join(this.rootDirectory, release.releaseId);
    await mkdir(releaseDirectory, { recursive: true });
    await writeFile(join(releaseDirectory, "index.html"), release.html, "utf8");
    await writeFile(
      join(releaseDirectory, "release.json"),
      JSON.stringify(release, null, 2),
      "utf8",
    );
  }

  public async exists(releaseId: string): Promise<boolean> {
    try {
      await access(join(this.rootDirectory, releaseId, "release.json"));
      return true;
    } catch {
      return false;
    }
  }

  public async findByPreviewSlug(previewSlug: string): Promise<SiteRelease | null> {
    let releaseDirectories: string[];

    try {
      releaseDirectories = await readdir(this.rootDirectory);
    } catch {
      return null;
    }

    for (const releaseId of releaseDirectories) {
      const manifestPath = join(this.rootDirectory, releaseId, "release.json");

      try {
        const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as SiteRelease;
        if (manifest.previewSlug === previewSlug) {
          return manifest;
        }
      } catch {
        continue;
      }
    }

    return null;
  }
}
