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

test("AC-1.2-3 rejects an invalid event time range", async ({ page }) => {
  await page.getByRole("button", { name: "新增行程" }).click();
  await page.getByLabel("行程標題").fill("無效時段");
  await page.getByLabel("開始時間").fill("11:00");
  await page.getByLabel("結束時間").fill("10:00");
  await page.getByRole("button", { name: "儲存行程" }).click();
  await expect(page.getByRole("status")).toContainText("結束時間必須晚於開始時間");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("AC-1.2-4 hides all events after clearing every category", async ({ page }) => {
  for (const name of ["學習", "工作", "娛樂", "運動"]) {
    const option = page.locator(".category-option").filter({ hasText: name }).first();
    await option.click();
  }
  await expect(page.locator(".event-card")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("AC-1.3-1 adds a custom category", async ({ page }) => {
  await page.getByRole("button", { name: "新增類別" }).first().click();
  await page.getByLabel("類別名稱").fill("社團");
  await page.getByRole("button", { name: "儲存類別" }).click();
  await expect(page.getByText("社團", { exact: true }).first()).toBeVisible();
});

test("AC-1.3-2 rejects a blank custom category name", async ({ page }) => {
  await page.getByRole("button", { name: "新增類別" }).first().click();
  await page.getByRole("button", { name: "儲存類別" }).click();
  await expect(page.getByRole("status")).toContainText("請輸入類別名稱");
});

test("AC-1.3-3 rejects a duplicate custom category name", async ({ page }) => {
  await page.getByRole("button", { name: "新增類別" }).first().click();
  await page.getByLabel("類別名稱").fill("運動");
  await page.getByRole("button", { name: "儲存類別" }).click();
  await expect(page.getByRole("status")).toContainText("類別名稱已存在");
});

test("AC-1.4-2 rejects saving an event in an occupied interval", async ({ page }) => {
  await page.getByRole("button", { name: "新增行程" }).click();
  await page.getByLabel("行程標題").fill("衝突行程");
  await page.getByLabel("日期").selectOption("0");
  await page.getByLabel("開始時間").fill("09:30");
  await page.getByLabel("結束時間").fill("09:45");
  await page.getByRole("button", { name: "儲存行程" }).click();
  await expect(page.getByRole("status")).toContainText("這個時段已有行程");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("AC-2.1-4 does not send a blank AI prompt", async ({ page }) => {
  await expect(page.getByRole("button", { name: "送出訊息" })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "輸入排程需求" })).toBeEmpty();
  await expect(page.locator(".proposal-card")).toHaveCount(0);
});

test("AC-2.3-1 only adds AI suggestions after confirmation", async ({ page }) => {
  await page.getByRole("textbox", { name: "輸入排程需求" }).fill("幫我安排本週三兩小時複習微積分");
  await page.getByRole("button", { name: "送出訊息" }).click();
  await expect(page.getByText("複習微積分", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /複習微積分/ })).toHaveCount(0);
  await page.getByRole("button", { name: "確認排程" }).click();
  await expect(page.getByRole("button", { name: /複習微積分/ })).toHaveCount(1);
});

test("AC-2.3-2 cancelling an AI proposal adds no events", async ({ page }) => {
  await page.getByRole("textbox", { name: "輸入排程需求" }).fill("幫我安排本週三兩小時複習微積分");
  await page.getByRole("button", { name: "送出訊息" }).click();
  await expect(page.getByText("排程提案", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.getByRole("button", { name: /複習微積分/ })).toHaveCount(0);
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

test("AC-3.2-1 switches to a selected group calendar", async ({ page }) => {
  await page.getByRole("button", { name: /小組模式/ }).click();
  await page.getByRole("button", { name: /產品設計小組/ }).click();
  await expect(page.getByRole("heading", { name: "產品設計小組." })).toBeVisible();
  await expect(page.getByText("共享行程即時同步，個人私密時段已妥善隱藏。")).toBeVisible();
});

test("AC-3.3-1 adds a shared group event and updates the group calendar", async ({ page }) => {
  await page.getByRole("button", { name: /小組模式/ }).click();
  await page.getByRole("button", { name: "新增行程" }).click();
  await page.getByLabel("行程標題").fill("週四晚上 8 點線上進度討論");
  await page.getByLabel("日期").selectOption("3");
  await page.getByLabel("開始時間").fill("20:00");
  await page.getByLabel("結束時間").fill("21:00");
  await page.getByRole("button", { name: "儲存行程" }).click();
  await expect(page.getByRole("button", { name: /週四晚上 8 點線上進度討論/ })).toHaveCount(1);
});

test("AC-4.3-1 confirms a group AI proposal before adding it", async ({ page }) => {
  await page.getByRole("button", { name: /小組模式/ }).click();
  await page.getByRole("textbox", { name: "輸入排程需求" }).fill("幫我們小組這週找一個大家都有空的 2 小時排專題討論");
  await page.getByRole("button", { name: "送出訊息" }).click();
  await expect(page.getByText("小組專題討論", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /小組專題討論/ })).toHaveCount(0);
  await page.getByRole("button", { name: "確認排程" }).click();
  await expect(page.getByRole("button", { name: /小組專題討論/ })).toHaveCount(1);
});
