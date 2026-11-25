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
- `/login` 與 `/register` 登入／註冊介面及欄位格式驗證。

登入／註冊目前僅提供介面與前端欄位驗證；送出帳密或 Google 登入不會呼叫驗證服務，也不會建立帳號或登入。行事曆目前仍可直接開啟，尚未實作登入保護。其餘示範資料僅存在瀏覽器頁面狀態中，重新整理後會還原；Supabase、正式帳號驗證與真正的 AI 排程服務尚未串接。

## 檢查

```bash
npm run lint
npm run test:unit
npx playwright test
npm run build
```
