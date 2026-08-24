import { expect, test } from "@playwright/test";

test("admin signs in and reaches protected, responsive application", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.test");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Ready for the first real module." }),
  ).toBeVisible();
  if (testInfo.project.name === "desktop") {
    await expect(page.getByRole("link", { name: "Access" })).toBeVisible();
  } else {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("link", { name: "Access" })).toBeVisible();
  }
  await page.getByRole("link", { name: "Audit trail" }).click();
  await expect(page.getByRole("heading", { name: "Audit trail" })).toBeVisible();
  await expect(page.getByText("membership.insert").first()).toBeVisible();
});

test("authenticated non-member is denied by app membership", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("outsider@example.test");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "No application access" })).toBeVisible();
});
