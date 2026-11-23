# 日日｜個人行程與小組共享行事曆

依照 `User Story.md` 與 `ARCHITECTURE.md` 建立的 Next.js App Router 前端 MVP 示範。

## 開始使用

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 預覽介面。

## 目前範圍

- 週行事曆、類別篩選與新增行程。
- AI 管家互動示範，提供需使用者確認才加入行事曆的排程提案。
- 小組模式、共享行程示範與「忙碌中」隱私遮罩。
- 新增自訂類別與小組的前端操作。

目前資料僅存在瀏覽器頁面狀態中，重新整理後會還原示範資料；尚未串接 Supabase、帳號驗證或真正的 AI 排程服務。

## 檢查

```bash
npm run lint
npm run test:unit
npx playwright test
npm run build
```
