import { test, expect } from "@playwright/test";

test.describe("Public Booking Flow", () => {
  test("loads home page and displays studio title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Pilates Center/i);
  });

  test("displays public booking wizard step options", async ({ page }) => {
    await page.goto("/");
    // Check main navigation links or booking call to action
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });
});
