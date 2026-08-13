# 工作室個案管理系統｜獨立部署版

這是把原本在 Claude 對話中的系統，改造成可以獨立運作、多台電腦共用同一份資料的網頁系統。

整體架構：
- **前端**：這個資料夾裡的網頁程式（React）
- **資料庫**：使用 [Supabase](https://supabase.com)（免費方案即可，用來取代原本 Claude 的儲存功能）
- **上線平台**：使用 [Vercel](https://vercel.com)（免費方案即可，讓你有一個網址可以在任何電腦打開）

完成設定後，工作室裡任何一台電腦，只要打開瀏覽器輸入同一個網址，就能看到並編輯同一份資料。

---

## 第一步：建立 Supabase 資料庫（約 5 分鐘）

1. 到 https://supabase.com 註冊一個免費帳號（可用 Google 帳號登入）
2. 建立一個新專案（New Project），資料庫密碼隨意設定並記下來
3. 專案建立完成後，左側選單找到 **SQL Editor**
4. 打開這個資料夾裡的 `supabase-setup.sql`，把內容整段複製貼到 SQL Editor
5. 按下 **Run** 執行，看到成功訊息即可（這會建立一個叫 `studio_data` 的資料表）
6. 左側選單找到 **Settings → API**，你會看到兩個之後要用到的值：
   - **Project URL**（例如 `https://xxxxx.supabase.co`）
   - **anon public** 金鑰（一長串英數字）

先把這兩個值記下來，下一步會用到。

---

## 第二步：設定連線資訊

1. 把資料夾裡的 `.env.example` 複製一份，改名為 `.env`
2. 打開 `.env`，把剛剛記下的兩個值貼進去：

```
VITE_SUPABASE_URL=你的 Project URL
VITE_SUPABASE_ANON_KEY=你的 anon public 金鑰
```

---

## 第三步：上線部署（推薦用 Vercel，全程免費）

### 方法 A：不用寫程式指令（適合完全不熟技術的人）

1. 到 https://vercel.com 註冊帳號（可用 GitHub 帳號登入，若沒有 GitHub 帳號需先申請一個，免費）
2. 到 https://github.com 建立一個新的 repository（例如叫 `studio-crm`），把這整個資料夾的檔案上傳上去（GitHub 網頁上有「上傳檔案」的功能，把資料夾內所有檔案拖曳上傳即可；**不要上傳 `.env` 這個檔案**，裡面是機密資料）
3. 回到 Vercel，選擇 **Add New → Project**，選擇剛剛上傳的 GitHub repository
4. 在部署設定畫面，找到 **Environment Variables**，把 `.env` 裡的兩個變數（`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`）貼上去
5. 按下 **Deploy**，等待約 1-2 分鐘完成
6. 完成後 Vercel 會給你一個網址，例如 `https://studio-crm.vercel.app`，這就是之後大家要打開的網址

### 方法 B：使用終端機指令（適合略懂電腦的人，更快）

在這個資料夾內開啟終端機，依序執行：

```bash
npm install -g vercel
npm install
vercel
```

依照畫面提示登入並設定，過程中它會問要不要設定環境變數，把 `.env` 裡的兩個值輸入進去即可。完成後一樣會得到一個網址。

---

## 第四步：其他電腦如何使用

其他電腦完全**不需要安裝任何軟體**，只要：
1. 打開瀏覽器（Chrome、Edge 都可以）
2. 輸入 Vercel 給你的網址
3. 就能看到跟其他電腦相同的資料，並且可以直接編輯

建議把這個網址做成瀏覽器書籤，或加到手機/電腦桌面方便開啟。

---

## 之後要更新程式功能時怎麼辦？

如果之後想請我（Claude）再幫忙新增功能，我會再給你一份更新後的 `src/App.jsx`。你只要：
1. 用新的檔案覆蓋掉 GitHub repository 裡舊的 `src/App.jsx`
2. Vercel 會自動偵測到更新並重新部署（通常 1-2 分鐘內完成）

資料庫（Supabase）的部分不需要重新設定，資料會一直保留。

---

## 注意事項

- 免費方案的 Supabase 及 Vercel，對一般小型工作室的使用量來說完全足夠
- 目前的設計是「所有能連上這個網址的人都能讀寫資料」，適合工作室內部使用；如果之後需要「帳號登入、不同人看不同資料」的權限控管，可以再進一步調整
- 建議偶爾在 Supabase 後台（Database → Backups）確認備份狀況，避免誤刪資料後無法復原
- 若多人同時在編輯，目前是「後儲存的會蓋過先儲存的」，建議點擊畫面上的「同步最新資料」按鈕確保看到最新狀態
