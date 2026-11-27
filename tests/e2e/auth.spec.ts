import { expect, test } from "@playwright/test";

test("AC-1.1-1 submits login credentials and shows a generic error for invalid credentials", async ({ page }) => {
  let loginRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/token") && request.method() === "POST") loginRequests += 1;
  });
  await page.route("**/auth/v1/token*", async (route) => {
    const corsHeaders = {
      "Access-Control-Allow-Origin": route.request().headers().origin ?? "http://127.0.0.1:3100",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "apikey,authorization,content-type,x-client-info",
    };

    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    await route.fulfill({
      status: 400,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({ code: "invalid_credentials", message: "Invalid login credentials" }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("電子郵件").fill("planner@example.com");
  await page.locator("#password").fill("password123");
  await page.getByRole("button", { name: "登入", exact: true }).click();

  await expect(page.getByRole("status")).toHaveText("帳號或密碼錯誤，請重新確認後再試。");
  await expect(page).toHaveURL(/\/login$/);
  expect(loginRequests).toBe(1);
});

test("AC-1.1-1 navigates to the calendar after successful login", async ({ page }) => {
  const corsHeaders = (origin: string | undefined) => ({
    "Access-Control-Allow-Origin": origin ?? "http://127.0.0.1:3100",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "apikey,authorization,content-type,x-client-info",
  });
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const accessToken = [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({ sub: "test-user", exp: Math.floor(Date.now() / 1000) + 3600 }),
    "test-signature",
  ].join(".");

  await page.route("**/auth/v1/token*", async (route) => {
    const headers = corsHeaders(route.request().headers().origin);
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers,
      body: JSON.stringify({
        access_token: accessToken,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "test-refresh-token",
        user: { id: "test-user", aud: "authenticated", role: "authenticated", email: "planner@example.com" },
      }),
    });
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.isNavigationRequest() && new URL(request.url()).pathname === "/") {
      await route.fulfill({ status: 200, contentType: "text/html", body: "<h1>Calendar</h1>" });
      return;
    }

    await route.fallback();
  });

  await page.goto("/login");
  await page.getByLabel("電子郵件").fill("planner@example.com");
  await page.locator("#password").fill("password123");
  await page.getByRole("button", { name: "登入", exact: true }).click();

  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
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
