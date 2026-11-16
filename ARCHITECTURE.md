# 系統架構與工程規範 (ARCHITECTURE.md)

## 1. 核心技術棧
- **框架：** Next.js (App Router，預設使用 React Server Components)
- **語言：** TypeScript (Strict Mode，嚴格型別檢查，嚴禁 `any`，全面搭配 Zod 驗證)
- **樣式與 UI：** Tailwind CSS、shadcn/ui (基於 Radix UI 原語)、CSS 變數主題 (Design Tokens)
- **後端與資料庫：** Supabase (Authentication、PostgreSQL、Realtime、Storage)
- **AI 驅動引擎：** Vercel AI SDK (於伺服器端執行 Tool Calling 結構化排程)
- **測試框架：** Vitest (單元/邏輯測試)、Playwright (端對端 E2E 測試)

---

## 2. 目錄結構與職責分工

```text
├── app/                            # App Router (路由、版型、Server Components)
│   ├── (auth)/                     # 路由群組：驗證相關流程 (登入/註冊)
│   ├── (dashboard)/                # 路由群組：需登入的主要應用畫面
│   │   ├── calendar/               # 個人行程規劃 (學習、工作、娛樂、自訂類別)
│   │   ├── groups/                 # 小組模式 (小組清單、成員空檔檢視、共享行程)
│   │   └── settings/               # 個人偏好設定與自訂類別管理
│   ├── api/                        # Route Handlers (伺服器端 API 端點)
│   │   ├── events/                 # 個人行程 CRUD（領域 A）
│   │   ├── categories/             # 類別 CRUD（領域 A）
│   │   ├── ai/schedule/            # AI 管家自然語言排程與 Function Calling 端點（領域 A）
│   │   └── groups/                 # 小組、邀請、共享行程、空檔 API（領域 B）
│   ├── layout.tsx                  # 全域根版型 (佈景主題與 Provider)
│   └── globals.css                 # 全域樣式與 Tailwind CSS 變數 (Design Tokens)
├── components/
│   ├── ui/                         # shadcn/ui 底層元件 (透過 CLI 安裝，純樣式原語)
│   ├── common/                     # 全站共用元件 (如 Header、Sidebar、UserAvatar)
│   └── features/                   # 依領域劃分的複合功能元件
│       ├── calendar/               # 行事曆視圖與行程展示元件（領域 A）
│       ├── groups/                 # 小組協作、成員清單與忙碌矩陣元件（領域 B）
│       ├── ai-assistant/           # AI 管家對話面板與排程提案卡片（領域 A）
│       └── categories/             # 類別標籤與色彩選擇元件（領域 A）
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Supabase Client SDK 初始化 (僅限瀏覽器端)
│   │   ├── server.ts               # Supabase Server SDK 初始化 (僅限伺服器端)
│   │   └── middleware.ts           # Session 更新與路由守衛中介邏輯
│   ├── schedules/                  # 行程管理商業邏輯與衝突檢測演算法（領域 A）
│   ├── groups/                     # 小組協作邏輯與隱私遮罩 (Busy-Matrix) 處理（領域 B）
│   ├── ai/                         # AI 管家 Prompt 與 Tool 定義（領域 A）
│   ├── api/                        # 共用 API 回應 Envelope 與錯誤碼（合約守門員維護）
│   └── utils.ts                    # 全域工具函式 (如 cn() class 合併器)
├── types/
│   ├── database.types.ts           # Supabase CLI 自動生成之資料庫型別
│   ├── schedule.ts                 # 行程與重複規則領域型別
│   ├── group.ts                    # 小組與權限領域型別
│   └── ai.ts                       # AI 排程提案與對話狀態型別
├── supabase/
│   ├── migrations/                 # 資料庫 DDL 與 RLS 遷移腳本
│   └── seed.sql                    # 開發測試初始資料
├── tests/
│   ├── unit/                       # Vitest 單元測試 (衝突演算法、隱私遮罩運算)
│   └── e2e/                        # Playwright 瀏覽器端對端測試 (排程、小組共享)
└── middleware.ts                   # Next.js 全域身分驗證與路由保護
```

### 架構核心原則：
1. **元件展示純粹化 (Presentational Purity)：** `components/` 內的元件只負責渲染 UI，嚴禁在元件內部直接呼叫資料庫查詢或複雜商業邏輯；資料與操作需透過 props 或 `lib/` 封裝的 hook/函式傳入。
2. **Server vs. Client Components 邊界：** 預設採用 React Server Components。只有需要使用 React Hooks (`useState`、`useEffect`) 或瀏覽器事件監聽（如日曆拖曳、即時對話）時，才在檔案頂端宣告 `'use client'`。
3. **AI 排程安全確認機制：** AI 管家僅能透過 Tool Calling 產出排程「提案 (Proposal)」，必須經由使用者在前端檢視並點擊「確認」後，方可寫入資料庫變更行程。
4. **小組隱私遮罩原則：** 在小組模式檢視成員空閒時間時，成員非小組公開的個人行程必須在 Service 層或資料庫層被抹除細節，僅保留「忙碌中 (Busy)」區塊以維護隱私。

---

## 3. Supabase 架構與 SDK 嚴格隔離

- **Client SDK (`lib/supabase/client.ts`)：**
  - 使用套件：`@supabase/ssr` 之 `createBrowserClient`。
  - 適用範圍：Client Components、瀏覽器自訂 Hooks (`useSchedules`、即時訂閱)。
  - 環境變數：僅能取用 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- **Server SDK (`lib/supabase/server.ts`)：**
  - 使用套件：`@supabase/ssr` 之 `createServerClient` (搭配 Next.js `cookies()`)。
  - 適用範圍：Server Actions (`app/actions/*`)、Route Handlers (`app/api/*`)、Server Components。
  - **安全紅線：** 嚴禁將 `SUPABASE_SERVICE_ROLE_KEY` 引入 Client Components 或公開模組，防止管理員私鑰洩漏。
- **資料轉換與強型別：**
  - 資料庫操作均透過 `types/database.types.ts` 保持嚴格型別校驗。
  - 所有資料表必須啟用 Row-Level Security (RLS)，確保跨使用者與小組資料的安全隔離。

---

## 4. UI 與設計系統規範
- **Design Tokens：** 顏色、間距、圓角必須使用 `globals.css` 定義的 CSS 變數（如 `bg-background`、`text-foreground`、`border-border`）。
- **Class 合併：** 所有條件式 class 合併必須使用 `@/lib/utils` 的 `cn()`。
- **元件新增：** 優先使用現有 `@/components/ui/*` 元件；若需新元件，統一透過終端機執行 `npx shadcn@latest add <component-name>`。
- **類別色彩規範：** 預設類別具備語意化樣式（學習為藍色系、工作為琥珀色系、娛樂為綠色系），自訂類別則統一綁定標準 HSL 變數確保在深淺主題下對比度正常。

---

## 5. 測試與驗收標準
每次程式碼變更都必須新增或更新相關單元測試與端對端測試，並在回報完成前執行兩種測試。所有 Pull Request 在合併前也必須通過以下驗證；若必要測試因指令、依賴套件或環境問題無法執行，必須明確回報阻礙，不得宣稱測試通過。
1. **單元測試 (Vitest)：**
   - 指令：`npm run test:unit`
   - 範圍：`lib/` 中的排程衝突檢測演算法、隱私遮罩過濾器、時區轉換與工具函式。
2. **端對端測試 (Playwright)：**
   - 指令：`npx playwright test`
   - 範圍：核心使用者路徑（身分驗證、向 AI 管家下達排程指令、開啟小組模式檢視共享行程）。
3. **安全規則驗證：**
   - 指令：`npm run test:db`
   - 範圍：驗證 Supabase RLS 策略，確保使用者無法越權讀寫其他使用者的私有行程或未加入之小組資料。
4. **測試與驗收條件對應（AC 追溯）：**
   - 每個測試案例名稱必須以 `AC-{Story編號}-{流水號}` 開頭（例如 `AC-1.1-2`），且能對應 `User Story.md` 中的一條驗收條件，不得有無對應的多餘測試，也不得有未被測試的 AC。
   - 嚴禁 `assert True`、`expect(x).toBeDefined()` 這類不驗證實質結果的斷言；成功情境必須斷言資料庫或回傳物件的實際數值，失敗情境必須斷言具體的 HTTP 狀態碼與錯誤碼。
   - 嚴禁為了讓 CI 通過而使用 `test.skip`、註解測試或吞掉例外。

---

## 6. 在地化與繁體中文（台灣）用語規範
專案中所有使用者可見文字（按鈕、提示、表單驗證、彈窗訊息、Toast、AI 管家回應）一律強制使用**繁體中文（台灣慣用詞）**。嚴禁使用簡體中文轉譯或中國大陸用語。

### 用語對照表：

| 台灣習慣用語 (必須使用) | 禁止使用之用語 (避免出現) |
| :--- | :--- |
| **使用者 / 會員** | 用戶 |
| **登入 / 登出** | 登錄 / 退出 |
| **設定** | 設置 |
| **專案** | 項目 |
| **預設** | 默認 |
| **支援** | 支持 |
| **資訊** | 信息 |
| **上傳 / 下載** | 上載 / 下載 |
| **連結** | 鏈接 |
| **建立** | 創建 |
| **確認 / 送出** | 提交 / 確定 |
| **行程 / 排程** | 日程 / 事件 |
| **類別** | 分類 / 標籤 |
| **小組模式** | 團隊模式 / 群組模式 |
| **AI 管家** | 智能助理 / 機器人 |
| **空閒時間 / 空檔** | 閒置時間 |
| **時間衝突** | 時間撞期 |
| **彈跳視窗 / 對話框** | 彈窗 / 浮窗 |
| **程式 / 軟體** | 程序 / 軟件 |
| **重新整理** | 刷新 |

---

## 7. 領域邊界與分工（Domain Boundaries）

專案切成兩個垂直領域，兩位「領域全端協作者」各負責一個，從 UI、API 到資料庫一條龍。

### 7.1 領域劃分

| 項目 | 領域 A：個人排程 | 領域 B：小組協作 |
| --- | --- | --- |
| 負責 User Story | 1.1～1.4、2.1～2.3 | 3.1～3.3、4.1～4.3 |
| 擁有的資料表 | `categories`、`events` | `groups`、`group_members`、`group_invites`、`group_events` |
| 擁有的目錄 | `components/features/calendar`、`categories`、`ai-assistant`；`lib/schedules`、`lib/ai`；`app/api/events`、`categories`、`ai` | `components/features/groups`；`lib/groups`；`app/api/groups` |
| 一句話 | 一個人的行事曆與 AI 管家 | 一群人的共享行程與隱私 |

### 7.2 MVP 範圍（第一輪只做這些，其餘待 MVP 全綠後再排入）

- **領域 A：** 1.1、1.2、1.3、2.1、2.3
- **領域 B：** 3.1、3.2、3.3、4.1
- **暫緩：** 1.4、2.2、4.2、4.3

新增任何 MVP 以外的功能，需由「產品與規格設計師」同意並更新 `User Story.md` 後才能開發。

### 7.3 跨領域規則（違反者 PR 一律退件）

1. **嚴禁跨領域直接讀寫對方的資料表。** 領域 B 不得查詢 `events`，領域 A 不得查詢 `groups` 相關資料表。
2. **跨領域資料只能透過 7.4 列出的官方出口取得。**
3. **隱私遮罩在出口處完成。** 領域 B 永遠拿不到其他成員私有行程的標題、類別與備註。
4. **每個領域的資料表都必須啟用 RLS，** 並有對應的 `npm run test:db` 測試。
5. **共用的 `lib/api/`（回應 Envelope 與錯誤碼）只有「脈絡架構與合約守門員」能修改。**

### 7.4 跨領域官方出口（領域 A 提供給領域 B）

| 函式 | 位置 | 說明 |
| --- | --- | --- |
| `getMemberBusyBlocks(userIds, range)` | `lib/schedules/busy.ts` | 回傳指定成員在時間範圍內的忙碌時段 `{ userId, startAt, endAt, isMasked, title?, categoryId? }`。私有行程只回傳時間，`title` 與 `categoryId` 一律不出現；小組公開行程可帶完整資訊；呼叫者查自己時不遮罩。 |
| `findFreeSlots(busyBlocks, durationMinutes, range)` | `lib/schedules/freeSlots.ts` | 純計算函式（不碰資料庫），輸入忙碌時段，輸出符合時長的空檔。供 4.2、4.3 使用。 |

領域 B 呼叫 `getMemberBusyBlocks` 前，必須先驗證呼叫者與 `userIds` 都是同一小組成員（成員資料屬於領域 B）。

---

## 8. API 合約（Contract-First）

### 8.1 共用回應格式（Envelope）

所有 API 一律回傳以下格式，由 `lib/api/response.ts` 提供 `ok()` 與 `fail()` 輔助函式，禁止各自手寫：

```ts
// 成功
{ "success": true, "data": <T> }

// 失敗
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "結束時間必須晚於開始時間" } }
```

- `message` 為使用者可見文字，必須符合第 6 節台灣用語。
- 時間欄位一律使用 ISO 8601 UTC 字串（例如 `2026-11-18T06:00:00.000Z`），畫面顯示時才轉為當地時區。
- 所有請求內容與回應內容都必須有 Zod schema，定義於 `types/`。

### 8.2 錯誤碼

| HTTP | 錯誤碼 | 使用情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | 輸入無效值（空白、格式錯誤、時間順序錯誤、時長無效） |
| 401 | `UNAUTHENTICATED` | 未登入 |
| 403 | `FORBIDDEN` | 已登入但權限不足 |
| 404 | `NOT_FOUND` | 找不到資源 |
| 409 | `CONFLICT` | 時間衝突或重複操作 |

### 8.3 領域 A 端點

| 方法與路徑 | 用途 | 對應 AC |
| --- | --- | --- |
| `GET /api/events?from=&to=&categoryIds=` | 查詢個人行程（可依類別篩選） | AC-1.2-1、1.2-4、1.2-5 |
| `POST /api/events` | 建立行程 | AC-1.2-1、1.2-2、1.2-3 |
| `PATCH /api/events/:id` | 修改行程（含時間、是否小組公開） | AC-1.4-x（暫緩）、AC-1.2-5 |
| `GET /api/categories` | 查詢預設與自訂類別 | AC-1.3-1 |
| `POST /api/categories` | 新增自訂類別 | AC-1.3-1～1.3-4 |
| `POST /api/ai/schedule` | 送出自然語言指令，回傳提案（不寫入） | AC-2.1-1～2.1-5 |
| `POST /api/ai/schedule/confirm` | 確認提案並寫入，需具冪等性 | AC-2.3-1～2.3-4 |

### 8.4 領域 B 端點

| 方法與路徑 | 用途 | 對應 AC |
| --- | --- | --- |
| `POST /api/groups` | 建立小組並產生邀請連結 | AC-3.1-1、3.1-2 |
| `GET /api/groups` | 查詢自己加入的小組 | AC-3.2-1、3.2-2 |
| `POST /api/groups/join` | 以邀請碼加入小組 | AC-3.1-1、3.1-3、3.1-4、3.1-5 |
| `GET /api/groups/:id/events` | 查詢小組日曆（含遮罩後的成員忙碌時段） | AC-3.2-1、3.2-3、4.1-1～4.1-4 |
| `POST /api/groups/:id/events` | 新增小組共享行程 | AC-3.3-1～3.3-3 |

### 8.5 資料表概要（欄位細節由各領域在 migration 中定義）

| 資料表 | 擁有者 | 關鍵欄位 |
| --- | --- | --- |
| `categories` | A | `id`、`owner_id`、`name`、`color`、`is_default` |
| `events` | A | `id`、`owner_id`、`category_id`、`title`、`start_at`、`end_at`、`is_group_public` |
| `groups` | B | `id`、`name`、`owner_id` |
| `group_members` | B | `group_id`、`user_id`、`role` |
| `group_invites` | B | `code`、`group_id`、`expires_at` |
| `group_events` | B | `id`、`group_id`、`created_by`、`title`、`start_at`、`end_at` |

### 8.6 合約變更流程

1. 任何人要改 API 或資料表，先在 Issue 提出，由「脈絡架構與合約守門員」確認。
2. 先更新本檔案與 Zod schema，再改程式。
3. 合約變更的 PR 必須同時通知另一個領域的全端與整合者審查。
