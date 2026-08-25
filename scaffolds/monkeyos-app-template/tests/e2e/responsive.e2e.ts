import { expect, test } from "@playwright/test";

test("admin signs in and reaches protected, responsive application", async ({ page }, testInfo) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
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
  await page.getByRole("link", { name: "Access" }).click();
  await expect(page.getByRole("heading", { name: "Application access" })).toBeVisible();
});

test("authenticated non-member is denied by app membership", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByLabel("Email").fill("outsider@example.test");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "No application access" })).toBeVisible();
});

test("health endpoint reports the immutable application identity", async ({ request }) => {
  const response = await request.get("/healthz");
  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({
    status: "ok",
    version: "2.9.0",
    sha: process.env.EXPECTED_GIT_SHA ?? "test",
  });
});

test("production server caches generated assets immutably", async ({ request }) => {
  test.skip(
    process.env.PLAYWRIGHT_PRODUCTION_IMAGE !== "true",
    "Only the built production image serves generated assets",
  );
  const document = await request.get("/login");
  expect(document.ok()).toBe(true);
  const assetPath = (await document.text()).match(/\/assets\/[^"']+\.js/)?.[0];
  if (!assetPath) throw new Error("React Router document did not reference a generated asset");
  const asset = await request.get(assetPath);
  expect(asset.ok()).toBe(true);
  expect(asset.headers()["cache-control"]).toContain("immutable");
});
