import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { SiteSpecification } from "@where-they-are/contracts";

export type SiteRelease = {
	releaseId: string;
	businessId?: string;
	siteId?: string;
	previewSlug: string;
	specification: SiteSpecification;
	html: string;
};

export class ReleaseStore {
	private readonly databaseEnabled: boolean;

	public constructor(
		private readonly rootDirectory = join(process.cwd(), "data", "releases"),
		databaseEnabled = process.env.DATABASE_ENABLED === "true"
	) {
		this.databaseEnabled = databaseEnabled;
	}

	public async save(release: SiteRelease): Promise<void> {
		const releaseDirectory = join(this.rootDirectory, release.releaseId);
		await mkdir(releaseDirectory, { recursive: true });
		await writeFile(join(releaseDirectory, "index.html"), release.html, "utf8");

		if (this.databaseEnabled) {
			if (!(release.businessId && release.siteId)) {
				throw new Error(
					"Database-backed releases require businessId and siteId"
				);
			}

			const { createSiteRelease } = await import("@where-they-are/db");
			await createSiteRelease({
				artifactPath: join(release.releaseId, "index.html"),
				businessId: release.businessId,
				previewSlug: release.previewSlug,
				releaseId: release.releaseId,
				siteId: release.siteId,
				specification: release.specification as never,
			});
			return;
		}

		await writeFile(
			join(releaseDirectory, "release.json"),
			JSON.stringify(release, null, 2),
			"utf8"
		);
	}

	public async exists(
		releaseId: string,
		businessId?: string
	): Promise<boolean> {
		if (this.databaseEnabled) {
			if (!businessId) {
				return false;
			}

			const { findReleaseForBusiness } = await import("@where-they-are/db");
			return Boolean(await findReleaseForBusiness(businessId, releaseId));
		}

		try {
			await access(join(this.rootDirectory, releaseId, "release.json"));
			return true;
		} catch {
			return false;
		}
	}

	public async findByPreviewSlug(
		previewSlug: string
	): Promise<SiteRelease | null> {
		if (this.databaseEnabled) {
			const { db } = await import("@where-they-are/db");
			const databaseRelease = await db.siteRelease.findUnique({
				where: { previewSlug },
			});

			if (!databaseRelease) {
				return null;
			}

			const artifactPath =
				databaseRelease.artifactPath ?? join(databaseRelease.id, "index.html");
			return {
				html: await readFile(join(this.rootDirectory, artifactPath), "utf8"),
				previewSlug: databaseRelease.previewSlug,
				releaseId: databaseRelease.id,
				specification:
					databaseRelease.specification as unknown as SiteSpecification,
			};
		}

		let releaseDirectories: string[];

		try {
			releaseDirectories = await readdir(this.rootDirectory);
		} catch {
			return null;
		}

		for (const releaseId of releaseDirectories) {
			try {
				const manifest = JSON.parse(
					await readFile(
						join(this.rootDirectory, releaseId, "release.json"),
						"utf8"
					)
				) as SiteRelease;

				if (manifest.previewSlug === previewSlug) {
					return manifest;
				}
			} catch {}
		}

		return null;
	}
}
