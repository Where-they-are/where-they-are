import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import type { Response } from "express";

import { ReleaseStore } from "./release-store.js";

@Controller("previews")
export class PreviewController {
	private readonly releaseStore = new ReleaseStore();

	@Get(":previewSlug")
	public async getPreview(
		@Param("previewSlug") previewSlug: string,
		@Res() response: Response
	): Promise<void> {
		const release = await this.releaseStore.findByPreviewSlug(previewSlug);
		if (!release) {
			throw new NotFoundException("Preview was not found");
		}

		response
			.header("X-Robots-Tag", "noindex, nofollow")
			.header("Cache-Control", "no-store")
			.type("html")
			.send(release.html);
	}
}
