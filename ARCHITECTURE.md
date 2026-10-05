├── app/                               # Next.js App Router (路由、版型、Server Components)
│   ├── (auth)/                        # 路由群組：驗證流程 (登入 / 註冊 / 密碼重設)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/                   # 路由群組：需登入的主要應用畫面
│   │   ├── layout.tsx                 # 儀表板版型 (含側邊導覽列與 AI 管家抽屜)
│   │   ├── calendar/page.tsx          # 個人行程檢視 (學習、工作、娛樂與自訂分類視圖)
│   │   ├── groups/                    # 小組模式模組
│   │   │   ├── page.tsx               # 小組清單與加入/建立小組
│   │   │   └── [groupId]/page.tsx     # 小組共享行程檢視與成員空閒時間矩陣
│   │   └── settings/page.tsx          # 個人偏好與自訂分類管理
│   ├── api/                           # 伺服器端 API 路由 (Route Handlers)
│   │   ├── ai/
│   │   │   └── schedule/route.ts      # AI 管家排程對話與 Tool Calling 介接端點
│   │   └── groups/
│   │       └── invite/route.ts        # 小組邀請驗證與成員加入處理
│   ├── layout.tsx                     # 根版型 (全域 ThemeProvider、QueryClientProvider)
│   └── globals.css                    # Tailwind CSS 變數定義與全域樣式
├── components/
│   ├── ui/                            # shadcn/ui 底層純樣式元件 (按鈕、對話框、選單)
│   ├── common/                        # 全站共用結構元件 (Navbar、Sidebar、UserAvatar)
│   └── features/                      # 領域功能複合展示元件 (Pure Presentational)
│       ├── calendar/                  # 行事曆核心視圖 (TimeGrid、EventCard、CategoryFilter)
│       ├── groups/                    # 小組協作元件 (MemberList、SharedEventModal、BusyMatrix)
│       ├── ai-assistant/              # AI 管家互動元件 (ChatSheet、ProposalCard、ConflictAlert)
│       └── categories/                # 類別管理元件 (CategoryBadge、ColorPickerModal)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Supabase 瀏覽器端客戶端 (createBrowserClient)
│   │   ├── server.ts                  # Supabase 伺服器端客戶端 (createServerClient 搭配 cookies)
│   │   └── middleware.ts              # Supabase Session 刷新中介邏輯
│   ├── schedules/                     # 行程管理業務邏輯
│   │   ├── scheduleService.ts         # 行程 CRUD 與資料庫操作
│   │   └── conflictDetector.ts        # 行程時間衝突檢測演算法 (純函式)
│   ├── groups/                        # 小組協作業務邏輯
│   │   ├── groupService.ts            # 小組成員管理與共享行程同步操作
│   │   └── privacyMasker.ts           # 成員隱私過濾器 (將私有行程轉為「忙碌中」區塊)
│   ├── ai/                            # AI 管家核心驅動
│   │   ├── butlerTools.ts             # 供 AI 呼叫的 Tools 定義 (建立行程、查詢空檔)
│   │   └── systemPrompt.ts            # AI 管家繁體中文角色設定與排程準則
│   └── utils.ts                       # 全域工具函式 (cn() 合併器、時間格式化)
├── types/
│   ├── database.types.ts              # 由 Supabase CLI 自動生成的資料庫型別定義
│   ├── schedule.ts                    # 行程、時間區段、重複規則領域型別
│   ├── category.ts                    # 類別（學習、工作、娛樂、自訂）領域型別
│   ├── group.ts                       # 小組、成員角色、共享權限領域型別
│   └── ai.ts                          # AI 對話訊息、建議提案 (Proposal) 資料結構
├── supabase/                          # Supabase 本地開發與遷移設定
│   ├── migrations/                    # SQL 資料庫遷移檔案 (Table DDL、RLS Policies、Functions)
│   └── seed.sql                       # 本地開發測試假資料
├── tests/
│   ├── unit/                          # Vitest 單元測試 (衝突演算法、隱私遮罩運算)
│   └── e2e/                           # Playwright 端對端測試 (AI 自動排程、小組共享流程)
└── middleware.ts                      # Next.js 全域中介軟體 (身分驗證與路由保護)
