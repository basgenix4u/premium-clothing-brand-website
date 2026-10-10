import { expect, test } from "@playwright/test";

test("home page renders and smoke endpoint responds", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Vellum" })).toBeVisible();

  const response = await request.get("/api/v1/health/smoke");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: "ok" });
});
