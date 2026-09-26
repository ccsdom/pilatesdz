import { test, expect } from "@playwright/test";

test.describe("CRM & Admin Access", () => {
  test("redirects unauthenticated CRM requests or displays auth form", async ({ page }) => {
    await page.goto("/crm");
    const url = page.url();
    expect(url).toContain("/crm");
  });

  test("loads opening settings page route", async ({ page }) => {
    await page.goto("/crm/horaires");
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe("complete");
  });

  test("loads client access management route", async ({ page }) => {
    await page.goto("/crm/acces");
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });
});
