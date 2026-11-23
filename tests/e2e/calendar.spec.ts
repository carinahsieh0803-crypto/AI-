import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("AC-1.2-1 creates a categorized event in the calendar", async ({ page }) => {
  await page.getByRole("button", { name: "新增行程" }).click();
  await page.getByLabel("行程標題").fill("完成介面提案");
  await page.getByRole("combobox").first().selectOption("工作");
  await page.getByLabel("日期").selectOption("5");
  await page.getByLabel("開始時間").fill("10:00");
  await page.getByLabel("結束時間").fill("11:00");
  await page.getByRole("button", { name: "儲存行程" }).click();
  await expect(page.getByRole("button", { name: /完成介面提案/ })).toHaveCount(1);
});

test("AC-1.2-2 rejects an empty event title", async ({ page }) => {
  await page.getByRole("button", { name: "新增行程" }).click();
  await page.getByRole("button", { name: "儲存行程" }).click();
  await expect(page.getByRole("status")).toContainText("請輸入標題");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("AC-2.3-1 only adds AI suggestions after confirmation", async ({ page }) => {
  await page.getByRole("textbox", { name: "輸入排程需求" }).fill("幫我安排本週三兩小時複習微積分");
  await page.getByRole("button", { name: "送出訊息" }).click();
  await expect(page.getByText("複習微積分", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /複習微積分/ })).toHaveCount(0);
  await page.getByRole("button", { name: "確認排程" }).click();
  await expect(page.getByRole("button", { name: /複習微積分/ })).toHaveCount(1);
});

test("AC-4.1-1 masks member private schedule details in group mode", async ({ page }) => {
  await page.getByRole("button", { name: /小組模式/ }).click();
  await expect(page.getByText("隱私保護已開啟")).toBeVisible();
  await expect(page.getByRole("button", { name: /忙碌中/ }).first()).toBeVisible();
  await expect(page.getByText("忙碌中", { exact: true }).first()).toBeVisible();
});

test("AC-3.1-1 creates a group and switches to its shared calendar", async ({ page }) => {
  await page.getByRole("button", { name: /小組模式/ }).click();
  await page.getByRole("button", { name: "建立小組" }).first().click();
  await page.getByLabel("小組名稱").fill("週三讀書會");
  await page.getByRole("button", { name: "建立小組" }).last().click();
  await expect(page.getByRole("heading", { name: "週三讀書會." })).toBeVisible();
  await expect(page.getByRole("button", { name: "邀請成員" })).toBeVisible();
});
