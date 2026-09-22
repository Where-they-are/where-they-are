import { mkdir, writeFile } from "node:fs/promises";
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
}
