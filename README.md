# About My OC — 空白 OC 網站模板

一個可離線使用、可透過 GitHub Pages 公開分享，並能直接在網頁表單中建立世界、角色與 IF 線的 OC 介紹網站。

此版本預設完全空白：

- 沒有預設世界
- 沒有預設角色
- 沒有預設 IF 線
- 公開網站為唯讀展示
- 編輯內容會先保存成目前瀏覽器中的本機草稿

## 最簡單的使用方式

### 1. 打開網頁編輯器

```text
https://kanamememe.github.io/About_my_OC/editor.html
```

第一次打開編輯器後，這台裝置的公開網站右上角會多出 **編輯內容**。其他訪客的瀏覽器不會顯示這個按鈕。

### 2. 直接填寫表單

編輯器支援：

- 修改網站名稱與首頁介紹
- 新增、複製、刪除世界
- 選擇世界風格
- 新增世界資料欄
- 新增、複製、刪除角色
- 填寫角色圖片、台詞、標籤、故事、基本資料與關係
- 新增、複製、刪除 IF 世界線
- 填寫 IF 分歧點、身分、圖片與專屬資料
- 自動把草稿儲存在目前瀏覽器
- 匯入先前由編輯器匯出的 `data.js`
- 下載新的 `data.js`

### 3. 發布內容

完成後按編輯器右上角的：

```text
複製並打開 GitHub
```

編輯器會：

1. 將新的 `data.js` 內容複製到剪貼簿。
2. 打開 GitHub 的 `data.js` 編輯頁。
3. 你在 GitHub 全選舊內容後貼上。
4. 按 **Commit changes**。
5. GitHub Pages 部署完成後，公開網站就會顯示新內容。

也可以按 **下載 data.js**，再手動上傳或替換 repository 裡的檔案。

> 純靜態 GitHub Pages 無法安全地把 GitHub 寫入密碼藏在公開網頁裡，因此目前不會在沒有 GitHub 確認的情況下直接提交。這能避免任何訪客利用網站修改你的 repository。

## 公開網站與編輯器的差別

| 頁面 | 用途 | 是否會改動公開內容 |
|---|---|---|
| `index.html` | 分享給訪客觀看 | 不會，唯讀 |
| `editor.html` | 建立與整理本機草稿 | 不會，直到你提交 `data.js` |
| GitHub 的 `data.js` | 真正公開發布的內容 | 提交後會更新公開網站 |

公開網址：

```text
https://kanamememe.github.io/About_my_OC/
```

編輯網址：

```text
https://kanamememe.github.io/About_my_OC/editor.html
```

訪客可以打開公開網址、分享角色頁或 IF 頁，但不能把修改寫回你的 repository。真正有權修改公開網站的仍只有 repository 擁有者與你主動加入的 Collaborators。

## 草稿保存方式

編輯器會將草稿存在目前瀏覽器的 `localStorage` 中。

這代表：

- 關掉頁面後再次打開，草稿通常仍會保留。
- 換手機、換瀏覽器或清除網站資料後，草稿不會自動跟著過去。
- 重要內容請定期按 **下載 data.js** 備份。
- 發布完成後，可以按 **載入目前已發布內容**，重新以線上版本為基礎編輯。

## 圖片

圖片仍需先放進 repository 的 `assets` 資料夾，再於編輯器填寫相對路徑。

建議結構：

```text
assets/
├── worlds/
│   └── my-world-cover.webp
└── characters/
    ├── character-main.webp
    └── character-if.webp
```

在表單中填入：

```text
assets/worlds/my-world-cover.webp
assets/characters/character-main.webp
```

圖片路徑與檔名會區分大小寫。`Photo.webp` 和 `photo.webp` 會被當作不同檔案。

## 離線使用

網站與編輯器都不依賴資料庫或外部套件：

1. 在 repository 按 **Code → Download ZIP**。
2. 解壓縮。
3. 打開 `index.html` 查看網站。
4. 打開 `editor.html` 編輯內容。

離線編輯器仍能建立草稿與下載 `data.js`。但離線狀態不能直接打開 GitHub 發布，也不會自動從 GitHub 取得新版資料。

部分 iPhone／iPad 的「檔案」預覽對多檔案 JavaScript 網站支援有限；使用 GitHub Pages 上的 `editor.html` 會比較穩定。

## 頁面風格

每個世界與 IF 線都能選擇：

```text
archive   檔案館
ancient   古風
cyber     科技風
zombie    喪屍風
fantasy   西幻風
school    校園風
```

## 強制更新

公開網站右上角的 **強制更新** 會用新的時間戳重新載入資料、樣式與程式。當 GitHub Pages 已完成部署，但瀏覽器仍顯示舊內容時，可以按這個按鈕。

## 檔案結構

```text
About_my_OC/
├── index.html             公開唯讀網站
├── editor.html            網頁表單編輯器
├── style.css              公開網站排版與主題
├── editor.css             編輯器排版
├── controls.css           分享與強制更新按鈕
├── app.js                 世界、角色與 IF 顯示系統
├── editor.js              表單編輯、草稿、匯入與匯出
├── controls.js            分享、更新與本機擁有者入口
├── data.js                真正發布的 OC 資料
├── SHARING.md             公開分享說明
└── assets/                世界封面與角色圖片
```

## 自動檢查

Repository 內的 GitHub Actions 會在每次提交後檢查 JavaScript 語法與必要檔案，降低發布後整頁無法顯示的風險。

## 分享模板給其他人

可在 **Settings → General** 勾選 **Template repository**。其他人按 **Use this template** 後，會得到自己的獨立 repository 與 OC 網站，不會修改你的原始網站。

程式碼授權與你的 OC 素材授權最好分開標示，例如：

- 網站程式碼可複製與修改
- 你的 OC 圖片與設定文字禁止轉載或再利用

目前 repository 尚未加入正式授權檔。
