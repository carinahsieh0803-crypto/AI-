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
│   │   ├── ai/schedule/            # AI 管家自然語言排程與 Function Calling 端點
│   │   └── groups/                 # 小組成員邀請與權限 API
│   ├── layout.tsx                  # 全域根版型 (佈景主題與 Provider)
│   └── globals.css                 # 全域樣式與 Tailwind CSS 變數 (Design Tokens)
├── components/
│   ├── ui/                         # shadcn/ui 底層元件 (透過 CLI 安裝，純樣式原語)
│   ├── common/                     # 全站共用元件 (如 Header、Sidebar、UserAvatar)
│   └── features/                   # 依領域劃分的複合功能元件
│       ├── calendar/               # 行事曆視圖與行程展示元件
│       ├── groups/                 # 小組協作、成員清單與忙碌矩陣元件
│       ├── ai-assistant/           # AI 管家對話面板與排程提案卡片
│       └── categories/             # 類別標籤與色彩選擇元件
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Supabase Client SDK 初始化 (僅限瀏覽器端)
│   │   ├── server.ts               # Supabase Server SDK 初始化 (僅限伺服器端)
│   │   └── middleware.ts           # Session 更新與路由守衛中介邏輯
│   ├── schedules/                  # 行程管理商業邏輯與衝突檢測演算法
│   ├── groups/                     # 小組協作邏輯與隱私遮罩 (Busy-Matrix) 處理
│   ├── ai/                         # AI 管家 Prompt 與 Tool 定義
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
所有 Pull Request 在合併前必須通過以下驗證：
1. **單元測試 (Vitest)：**
   - 指令：`npm run test:unit`
   - 範圍：`lib/` 中的排程衝突檢測演算法、隱私遮罩過濾器、時區轉換與工具函式。
2. **端對端測試 (Playwright)：**
   - 指令：`npx playwright test`
   - 範圍：核心使用者路徑（身分驗證、向 AI 管家下達排程指令、開啟小組模式檢視共享行程）。
3. **安全規則驗證：**
   - 指令：`npm run test:db`
   - 範圍：驗證 Supabase RLS 策略，確保使用者無法越權讀寫其他使用者的私有行程或未加入之小組資料。

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