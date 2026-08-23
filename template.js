(() => {
  "use strict";

  const app = document.getElementById("app");
  if (!app) return;

  const sourceRepository = "Kanamememe/About_my_OC";
  const sourceUrl = `https://github.com/${sourceRepository}`;
  const startPage = "start.html";
  const editorPage = "editor.html";

  function isHomeRoute() {
    const route = (window.location.hash || "#/").replace(/^#\/?/, "");
    return route.split("/").filter(Boolean).length === 0;
  }

  function installHomeEntries() {
    const templateEntry = document.getElementById("template-entry");
    const editorEntry = document.getElementById("editor-entry-panel");

    if (!isHomeRoute()) {
      templateEntry?.remove();
      editorEntry?.remove();
      return;
    }

    const pageStack = app.querySelector(".page-stack");
    if (!pageStack) return;

    const worlds = Array.isArray(window.OC_SITE_DATA?.worlds) ? window.OC_SITE_DATA.worlds : [];

    if (!worlds.length && !editorEntry) {
      const section = document.createElement("section");
      section.id = "editor-entry-panel";
      section.className = "template-callout editor-callout panel";
      section.innerHTML = `
        <div class="template-callout-copy">
          <p class="eyebrow">WORLD EDITOR</p>
          <h2>建立第一個世界</h2>
          <p>直接進入網頁編輯器，用表單填寫世界名稱、風格、角色與 IF 線，不需要自己修改程式碼。</p>
        </div>
        <div class="template-callout-actions">
          <a class="template-button primary editor-main-button" href="${editorPage}">＋ 立即建立世界</a>
        </div>`;

      pageStack.insertBefore(section, pageStack.children[1] || null);
    } else if (worlds.length) {
      editorEntry?.remove();
    }

    if (!templateEntry) {
      const section = document.createElement("section");
      section.id = "template-entry";
      section.className = "template-callout panel";
      section.innerHTML = `
        <div class="template-callout-copy">
          <p class="eyebrow">CREATE YOUR OWN ARCHIVE</p>
          <h2>建立自己的 OC 網站</h2>
          <p>從空白模板建立獨立網站。每個人都有自己的世界、角色、編輯器、公開網址與發布權限，不會互相覆蓋資料。</p>
        </div>
        <div class="template-callout-actions">
          <a class="template-button primary" href="${startPage}">開始建立</a>
          <a class="template-button" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">查看模板</a>
        </div>`;

      pageStack.append(section);
    }
  }

  const observer = new MutationObserver(installHomeEntries);
  observer.observe(app, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => window.setTimeout(installHomeEntries, 0));
  installHomeEntries();
})();
