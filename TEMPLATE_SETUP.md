# 多人各自公開：模板設定

這個專案的設計方式是：每位創作者都從同一份模板建立自己的 repository，再各自啟用 GitHub Pages。如此每個人都會有獨立內容、圖片、編輯器、網址與權限。

## 模板擁有者的一次性設定

在 `Kanamememe/About_my_OC`：

1. 打開 **Settings**。
2. 進入 **General**。
3. 在 repository 基本設定區勾選 **Template repository**。
4. 回到 repository 首頁，確認出現 **Use this template**。

完成後，首頁與 `start.html` 中的「使用模板建立」就能直接建立新的獨立 repository。

## 其他創作者的流程

1. 打開公開網站首頁的 **建立自己的 OC 網站**。
2. 按 **使用模板建立**。
3. 選擇自己的 GitHub 帳號與 repository 名稱。
4. 到新 repository 的 **Settings → Pages**。
5. Source 選 **Deploy from a branch**。
6. Branch 選 `main`，資料夾選 `/ (root)`。
7. 打開自己的：

```text
https://USERNAME.github.io/REPOSITORY/editor.html
```

8. 在網頁編輯器建立世界、角色與 IF 線。
9. 按 **複製並打開 GitHub**，提交自己的 `data.js`。
10. 分享自己的公開網址。

## 權限

- 每個人的 repository 都彼此獨立。
- 一般訪客只能觀看公開網站。
- 只有 repository 擁有者或被加入的 Collaborators 能提交修改。
- 不要把只需要觀看的人加入 Collaborators。

## Fork 備用方式

若模板功能尚未啟用，`start.html` 會顯示提醒。其他人可以暫時按 **改用 Fork**，但正式分享時仍建議啟用 Template repository，建立流程會更乾淨。
