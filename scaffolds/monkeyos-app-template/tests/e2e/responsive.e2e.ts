import { expect, test } from "@playwright/test";

test("admin signs in and reaches protected, responsive application", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.test");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Good work starts with clarity." })).toBeVisible();
  if (testInfo.project.name === "desktop") {
    await expect(page.getByRole("link", { name: "Access" })).toBeVisible();
  } else {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("link", { name: "Access" })).toBeVisible();
  }
  await page.getByRole("link", { name: "Work items" }).click();
  await expect(page.getByRole("heading", { name: "Work items" })).toBeVisible();
  await expect(page.getByText("Confirm the first business owner")).toBeVisible();
});

test("authenticated non-member is denied by app membership", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("outsider@example.test");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "No application access" })).toBeVisible();
});
