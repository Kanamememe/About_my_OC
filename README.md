# About My OC — 簡易版模板

一個不需要安裝套件、可直接使用 GitHub Pages 發布的 OC 世界觀與角色介紹網站。

## 目前功能

- 首頁以「世界」區分 OC
- 每個世界可指定不同的預設風格
- 世界頁顯示世界設定與所屬角色
- 角色頁顯示圖片、資料、故事、關係與 IF 線
- 可從角色介紹頁直接進入該角色的 IF 頁
- IF 頁可套用不同於主世界的風格
- 支援檔案館、古風、科技、喪屍、西幻、校園六種風格
- 支援手機與電腦版排版
- 使用 View Transitions API 製作共享元素轉場；不支援時會自動使用淡入淡出
- 記住訪客上次選擇的頁面風格
- 圖片尚未加入時會顯示姓名占位，不會出現破圖

## 檔案結構

```text
About_my_OC/
├── index.html       網站基本骨架
├── style.css        排版、主題與轉場
├── app.js           世界、角色及 IF 頁面系統
├── data.js          最常修改的網站與 OC 資料
├── README.md        使用教學
└── assets/          世界封面與角色圖片
```

一般使用時，主要修改 `data.js` 並把圖片放入 `assets`；不需要為每名角色另外建立 HTML。

## 開啟 GitHub Pages

1. 進入此 repository 的 **Settings**。
2. 在左側選擇 **Pages**。
3. `Build and deployment` 的 Source 選擇 **Deploy from a branch**。
4. Branch 選擇 `main`，資料夾選擇 `/ (root)`。
5. 按下 **Save**。

發布後的網址通常是：

```text
https://kanamememe.github.io/About_my_OC/
```

## 修改網站名稱

打開 `data.js`，修改最前面的 `site`：

```js
site: {
  title: "你的網站名稱",
  tagline: "副標題",
  mark: "OC",
  introTitle: "首頁大標題",
  introText: "首頁介紹",
  footer: "頁尾文字"
}
```

## 新增世界

在 `data.js` 的 `worlds` 陣列內複製一個完整世界物件：

```js
{
  id: "my-world",
  name: "世界名稱",
  subtitle: "MY WORLD",
  theme: "fantasy",
  symbol: "界",
  cover: "assets/worlds/my-world-cover.webp",
  description: "世界簡介。",
  facts: [
    { label: "世界類型", value: "西幻" },
    { label: "主要地點", value: "王都" }
  ],
  characters: []
}
```

可使用的 `theme`：

```text
archive   檔案館
ancient   古風
cyber     科技風
zombie    喪屍風
fantasy   西幻風
school    校園風
```

`id` 請使用小寫英文、數字與連字號，不要加入空格，例如：

```text
moon-shrine
white-tower
school-if
```

## 新增角色

將以下物件放進所屬世界的 `characters: []`：

```js
{
  id: "character-id",
  name: "角色名字",
  englishName: "English Name",
  role: "角色身分",
  image: "assets/characters/character-main.webp",
  quote: "角色代表台詞",
  tags: ["標籤一", "標籤二"],
  profile: [
    { label: "生日", value: "1月1日" },
    { label: "種族", value: "人類" }
  ],
  story: [
    "第一段角色故事。",
    "第二段角色故事。"
  ],
  relationships: [
    {
      name: "另一名角色",
      relation: "朋友",
      note: "關係補充。"
    }
  ],
  ifLines: []
}
```

圖片還沒準備好時，可以先寫：

```js
image: ""
```

網站會自動顯示角色姓名占位。

## 新增 IF 線

將以下物件放進角色的 `ifLines: []`：

```js
{
  id: "school",
  name: "校園 IF",
  theme: "school",
  role: "學生",
  image: "assets/characters/character-school-if.webp",
  divergence: "原世界的災難從未發生。",
  description: "這條 IF 的簡介。",
  quote: "此世界線的代表台詞。",
  profile: [
    { label: "身分", value: "學生" },
    { label: "年級", value: "二年級" }
  ]
}
```

儲存後，角色主頁會自動產生 IF 卡片，不必建立另一個 HTML 檔案。

## 放入圖片

建議使用：

```text
assets/
├── worlds/
│   └── my-world-cover.webp
└── characters/
    ├── character-main.webp
    └── character-school-if.webp
```

然後在 `data.js` 填入相對路徑：

```js
cover: "assets/worlds/my-world-cover.webp"
image: "assets/characters/character-main.webp"
```

GitHub Pages 會區分檔名大小寫，`Photo.webp` 與 `photo.webp` 會被視為不同檔案。

## 分享給其他人使用

完成通用模板後，可以前往 **Settings → General**，勾選 **Template repository**。其他人便能按下 **Use this template**，建立自己的獨立 OC 網站。

程式碼授權與 OC 素材授權最好分開標示。例如：

- 網站程式碼可以複製與修改
- 你的 OC 圖片與設定文字禁止轉載或再利用

目前 repository 尚未加入授權檔；確定分享規則後再選擇合適的 `LICENSE`。
