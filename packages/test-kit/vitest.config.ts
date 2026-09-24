import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		exclude: ["node_modules/**", "dist/**"],
		include: ["src/**/*.test.ts"],
		restoreMocks: true,
	},
});
