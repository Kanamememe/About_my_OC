(() => {
  "use strict";

  const app = document.getElementById("app");
  if (!app) return;

  const sourceRepository = "Kanamememe/About_my_OC";
  const sourceUrl = `https://github.com/${sourceRepository}`;
  const startPage = "start.html";

  function isHomeRoute() {
    const route = (window.location.hash || "#/").replace(/^#\/?/, "");
    return route.split("/").filter(Boolean).length === 0;
  }

  function installTemplateEntry() {
    const existing = document.getElementById("template-entry");

    if (!isHomeRoute()) {
      existing?.remove();
      return;
    }

    if (existing) return;

    const pageStack = app.querySelector(".page-stack");
    if (!pageStack) return;

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

  const observer = new MutationObserver(installTemplateEntry);
  observer.observe(app, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => window.setTimeout(installTemplateEntry, 0));
  installTemplateEntry();
})();
