# assets

把世界封面、角色頭像、立繪與 IF 圖片放在這個資料夾。

建議結構：

```text
assets/
├── worlds/
│   └── my-world-cover.webp
└── characters/
    ├── character-avatar.webp
    ├── character-main.webp
    └── character-school-if.webp
```

上傳圖片後，到根目錄的 `data.js` 填入相對路徑，例如：

```js
cover: "assets/worlds/my-world-cover.webp"
image: "assets/characters/character-main.webp"
```

GitHub Pages 會區分檔名大小寫，請確認程式內的路徑與實際檔名完全相同。
