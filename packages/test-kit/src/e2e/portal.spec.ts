import { expect, test } from "@playwright/test";

test.describe("portal to central server", () => {
  test("renders the portal and central API status section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Central API Status" })).toBeVisible();
    await expect(page.locator("body")).toContainText("http://localhost:3100");
  });
});
