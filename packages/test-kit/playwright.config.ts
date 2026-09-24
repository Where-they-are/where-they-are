import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	forbidOnly: Boolean(process.env.CI),
	fullyParallel: true,
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	reporter: [["list"], ["html", { open: "never" }]],
	retries: process.env.CI ? 2 : 0,
	testDir: "./src/e2e",
	use: {
		baseURL: process.env.WEB_BASE_URL ?? "http://localhost:3001",
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
	},
});
