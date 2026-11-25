import { expect, test } from "@playwright/test";

test("AC-1.1-1 shows that login is unavailable until an auth service is connected", async ({ page }) => {
  let authRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/auth/")) authRequests += 1;
  });

  await page.goto("/login");
  await page.getByLabel("電子郵件").fill("planner@example.com");
  await page.locator("#password").fill("password123");
  await page.getByRole("button", { name: "登入", exact: true }).click();

  await expect(page.getByRole("status")).toHaveText("目前尚未連接驗證服務，尚未登入。");
  await expect(page).toHaveURL(/\/login$/);
  expect(authRequests).toBe(0);
});

test("AC-1.1-3 validates required fields and email format without sending a request", async ({ page }) => {
  let authRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/auth/")) authRequests += 1;
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "登入", exact: true }).click();

  await expect(page.getByText("請輸入電子郵件。")).toBeVisible();
  await expect(page.getByText("請輸入密碼。")).toBeVisible();

  await page.getByLabel("電子郵件").fill("not-an-email");
  await page.locator("#password").fill("password123");
  await page.getByRole("button", { name: "登入", exact: true }).click();

  await expect(page.getByText("請輸入有效的電子郵件格式。")).toBeVisible();
  expect(authRequests).toBe(0);
});

test("AC-1.1-3 validates registration password length and confirmation", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("電子郵件").fill("planner@example.com");
  await page.locator("#password").fill("short");
  await page.getByLabel("確認密碼").fill("different");
  await page.getByRole("button", { name: "建立帳號" }).click();

  await expect(page.getByText("密碼至少需要 8 個字元。")).toBeVisible();
  await expect(page.getByText("兩次輸入的密碼不一致。")).toBeVisible();
});

test("AC-1.1-1 explains Google login is unavailable before provider setup", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "使用 Google 登入" }).click();

  await expect(page.getByRole("status")).toHaveText("Google 登入尚未連接驗證服務，目前無法登入。");
  await expect(page).toHaveURL(/\/login$/);
});
