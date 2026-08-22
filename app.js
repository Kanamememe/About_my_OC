(() => {
  "use strict";

  const data = window.OC_SITE_DATA;
  const app = document.getElementById("app");
  const themeSelect = document.getElementById("theme-select");
  const titleNode = document.getElementById("site-title");
  const taglineNode = document.getElementById("site-tagline");
  const markNode = document.getElementById("brand-mark");
  const footerNode = document.getElementById("footer-text");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const THEME_KEY = "about-my-oc-theme";

  if (!data || !Array.isArray(data.worlds)) {
    app.innerHTML = '<section class="panel not-found"><h1>資料錯誤</h1><p>找不到 data.js 中的 OC_SITE_DATA。</p></section>';
    return;
  }

  titleNode.textContent = data.site?.title || "OC 檔案館";
  taglineNode.textContent = data.site?.tagline || "Worlds, Characters & IF Lines";
  markNode.textContent = data.site?.mark || "OC";
  footerNode.textContent = data.site?.footer || "About My OC";

  const escapeHTML = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function safeAsset(value = "") {
    const path = String(value).trim();
    if (!path || /^javascript:/i.test(path)) return "";
    if (/^data:/i.test(path) && !/^data:image\//i.test(path)) return "";
    return escapeHTML(path);
  }

  function viewName(value = "item") {
    return `oc-${String(value).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  }

  function initials(name = "OC") {
    return [...String(name).trim()].slice(0, 2).join("") || "OC";
  }

  function picture(image, name, kind = "character") {
    const source = safeAsset(image);
    if (source) {
      return `<img src="${source}" alt="${escapeHTML(name)}" loading="lazy" decoding="async">`;
    }
    return `<div class="placeholder ${escapeHTML(kind)}-placeholder" aria-label="${escapeHTML(name)} 圖片占位"><span>${escapeHTML(initials(name))}</span><small>替換圖片</small></div>`;
  }

  function worldById(id) {
    return data.worlds.find((world) => world.id === id);
  }

  function characterById(world, id) {
    return world?.characters?.find((character) => character.id === id);
  }

  function ifById(character, id) {
    return character?.ifLines?.find((line) => line.id === id);
  }

  function routeParts() {
    const route = (location.hash || "#/").replace(/^#\/?/, "");
    return route.split("/").filter(Boolean).map((part) => {
      try { return decodeURIComponent(part); } catch { return part; }
    });
  }

  function routeData() {
    const parts = routeParts();
    if (!parts.length) return { page: "home" };
    if (parts[0] !== "world") return { page: "missing" };

    const world = worldById(parts[1]);
    if (!world) return { page: "missing" };
    if (parts.length === 2) return { page: "world", world };
    if (parts[2] !== "character") return { page: "missing" };

    const character = characterById(world, parts[3]);
    if (!character) return { page: "missing" };
    if (parts.length === 4) return { page: "character", world, character };
    if (parts[4] !== "if") return { page: "missing" };

    const ifLine = ifById(character, parts[5]);
    if (!ifLine) return { page: "missing" };
    return { page: "if", world, character, ifLine };
  }

  function readTheme() {
    try { return localStorage.getItem(THEME_KEY) || "auto"; }
    catch { return "auto"; }
  }

  function writeTheme(value) {
    try { localStorage.setItem(THEME_KEY, value); }
    catch { /* 儲存失敗不影響網站 */ }
  }

  function automaticTheme(context) {
    if (context.page === "if") return context.ifLine.theme || context.world.theme || "archive";
    if (context.world) return context.world.theme || "archive";
    return "archive";
  }

  function applyTheme(context = routeData()) {
    const selected = themeSelect.value || "auto";
    document.body.dataset.theme = selected === "auto" ? automaticTheme(context) : selected;
  }

  themeSelect.value = readTheme();
  themeSelect.addEventListener("change", () => {
    writeTheme(themeSelect.value);
    applyTheme();
  });

  const hrefWorld = (world) => `#/world/${encodeURIComponent(world.id)}`;
  const hrefCharacter = (world, character) => `${hrefWorld(world)}/character/${encodeURIComponent(character.id)}`;
  const hrefIf = (world, character, line) => `${hrefCharacter(world, character)}/if/${encodeURIComponent(line.id)}`;

  function crumbs(items) {
    return `<nav class="breadcrumbs" aria-label="目前位置">${items.map((item, index) => {
      const separator = index ? '<span class="separator">／</span>' : "";
      const content = item.href
        ? `<a href="${item.href}" data-route>${escapeHTML(item.label)}</a>`
        : `<span aria-current="page">${escapeHTML(item.label)}</span>`;
      return separator + content;
    }).join("")}</nav>`;
  }

  function profileRows(rows = []) {
    if (!rows.length) return '<p class="empty-message">尚未填寫資料。</p>';
    return `<dl class="profile-list">${rows.map((row) => `
      <div class="profile-row">
        <dt>${escapeHTML(row.label)}</dt>
        <dd>${escapeHTML(row.value)}</dd>
      </div>`).join("")}</dl>`;
  }

  function tags(items = []) {
    return items.length
      ? `<div class="pill-list">${items.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>`
      : "";
  }

  function worldCard(world) {
    const count = world.characters?.length || 0;
    const ifCount = (world.characters || []).reduce((sum, character) => sum + (character.ifLines?.length || 0), 0);
    return `
      <a class="world-card panel" href="${hrefWorld(world)}" data-route>
        <div class="world-card-visual" style="view-transition-name:${viewName(`world-${world.id}`)}">
          ${picture(world.cover, world.name, "world")}
        </div>
        <div class="world-card-overlay"></div>
        <div class="world-card-content">
          <p class="eyebrow">${escapeHTML(world.subtitle || "WORLD ARCHIVE")}</p>
          <h2>${escapeHTML(world.name)}</h2>
          <p>${escapeHTML(world.description)}</p>
          <div class="world-meta"><span>${count} 名角色</span><span>${ifCount} 條 IF</span></div>
        </div>
      </a>`;
  }

  function characterCard(world, character) {
    return `
      <a class="character-card panel" href="${hrefCharacter(world, character)}" data-route>
        <div class="character-card-visual" style="view-transition-name:${viewName(`character-${world.id}-${character.id}`)}">
          ${picture(character.image, character.name)}
        </div>
        <div class="character-card-copy">
          <p class="eyebrow">${escapeHTML(character.englishName || "CHARACTER")}</p>
          <h3>${escapeHTML(character.name)}</h3>
          <p class="role">${escapeHTML(character.role)}</p>
          <p class="quote">「${escapeHTML(character.quote)}」</p>
          ${tags(character.tags)}
        </div>
      </a>`;
  }

  function renderHome() {
    return `
      <div class="page-stack">
        <section class="home-hero panel">
          <div>
            <p class="eyebrow">ABOUT MY OC</p>
            <h1>${escapeHTML(data.site?.introTitle || "選擇一個世界")}</h1>
            <p class="lead">${escapeHTML(data.site?.introText || "")}</p>
          </div>
          <div class="hero-mark" aria-hidden="true"><span>${escapeHTML(data.site?.mark || "OC")}</span></div>
        </section>
        <section>
          <div class="section-heading">
            <div><p class="eyebrow">WORLD ARCHIVE</p><h2>世界檔案</h2></div>
            <p>進入不同世界時，頁面會自動換成該世界的預設風格。</p>
          </div>
          <div class="world-grid">${data.worlds.map(worldCard).join("")}</div>
        </section>
      </div>`;
  }

  function renderWorld(world) {
    const facts = (world.facts || []).map((fact) => `
      <div class="fact-card"><span>${escapeHTML(fact.label)}</span><strong>${escapeHTML(fact.value)}</strong></div>`).join("");
    const characters = (world.characters || []).map((character) => characterCard(world, character)).join("");

    return `
      <div class="page-stack">
        ${crumbs([{ label: "所有世界", href: "#/" }, { label: world.name }])}
        <section class="world-hero panel">
          <div class="world-hero-visual" style="view-transition-name:${viewName(`world-${world.id}`)}">
            ${picture(world.cover, world.name, "world")}
          </div>
          <div class="world-hero-copy">
            <p class="eyebrow">${escapeHTML(world.subtitle || "WORLD ARCHIVE")}</p>
            <h1>${escapeHTML(world.name)}</h1>
            <p class="lead">${escapeHTML(world.description)}</p>
            <a class="text-link" href="#characters">查看所屬角色</a>
          </div>
        </section>
        ${facts ? `<section><div class="section-heading"><div><p class="eyebrow">WORLD DATA</p><h2>世界資料</h2></div></div><div class="fact-grid">${facts}</div></section>` : ""}
        <section id="characters">
          <div class="section-heading"><div><p class="eyebrow">CHARACTERS</p><h2>所屬角色</h2></div><p>選擇角色以查看主線設定與 IF 分支。</p></div>
          <div class="character-grid">${characters || '<p class="empty-message panel">這個世界還沒有角色。</p>'}</div>
        </section>
      </div>`;
  }

  function renderRelationships(items = []) {
    if (!items.length) return '<p class="empty-message">尚未填寫關係。</p>';
    return `<div class="relationship-list">${items.map((item) => `
      <article class="relationship-card">
        <strong>${escapeHTML(item.name)}</strong>
        <span>${escapeHTML(item.relation)}</span>
        <p>${escapeHTML(item.note || "")}</p>
      </article>`).join("")}</div>`;
  }

  function renderIfCards(world, character) {
    const lines = character.ifLines || [];
    if (!lines.length) return '<div class="empty-if">這名角色目前沒有 IF 線。</div>';
    return `<div class="if-grid">${lines.map((line) => `
      <a class="if-card" href="${hrefIf(world, character, line)}" data-route>
        <span class="if-watermark" aria-hidden="true">IF</span>
        <div>
          <p class="eyebrow">PARALLEL LINE</p>
          <h3>${escapeHTML(line.name)}</h3>
          <p class="if-role">${escapeHTML(line.role || "")}</p>
          <p>${escapeHTML(line.description || "")}</p>
          <span class="text-link">進入世界線</span>
        </div>
      </a>`).join("")}</div>`;
  }

  function renderCharacter(world, character) {
    const stories = (character.story || []).map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("");
    return `
      <div class="page-stack">
        ${crumbs([
          { label: "所有世界", href: "#/" },
          { label: world.name, href: hrefWorld(world) },
          { label: character.name }
        ])}
        <section class="character-hero panel">
          <div class="character-portrait" style="view-transition-name:${viewName(`character-${world.id}-${character.id}`)}">
            ${picture(character.image, character.name)}
          </div>
          <div class="character-main-copy">
            <p class="eyebrow">${escapeHTML(character.englishName || "CHARACTER FILE")}</p>
            <h1>${escapeHTML(character.name)}</h1>
            <p class="character-role">${escapeHTML(character.role)}</p>
            <blockquote>「${escapeHTML(character.quote)}」</blockquote>
            ${tags(character.tags)}
          </div>
        </section>
        <section class="content-columns">
          <article class="panel content-panel">
            <p class="eyebrow">STORY</p><h2>角色故事</h2>
            <div class="story-copy">${stories || '<p class="empty-message">尚未填寫故事。</p>'}</div>
          </article>
          <aside class="panel content-panel">
            <p class="eyebrow">PROFILE</p><h2>基本資料</h2>
            ${profileRows(character.profile)}
          </aside>
        </section>
        <section class="panel content-panel">
          <p class="eyebrow">RELATIONSHIPS</p><h2>角色關係</h2>
          ${renderRelationships(character.relationships)}
        </section>
        <section>
          <div class="section-heading"><div><p class="eyebrow">IF LINES</p><h2>平行世界分支</h2></div><p>從主線角色頁直接進入同一角色的其他可能性。</p></div>
          ${renderIfCards(world, character)}
        </section>
      </div>`;
  }

  function renderIf(world, character, line) {
    return `
      <div class="page-stack">
        ${crumbs([
          { label: "所有世界", href: "#/" },
          { label: world.name, href: hrefWorld(world) },
          { label: character.name, href: hrefCharacter(world, character) },
          { label: line.name }
        ])}
        <section class="if-hero panel">
          <div class="if-portrait" style="view-transition-name:${viewName(`character-${world.id}-${character.id}`)}">
            ${picture(line.image || character.image, `${character.name}・${line.name}`)}
          </div>
          <div class="if-copy">
            <span class="if-badge">IF WORLD LINE</span>
            <p class="eyebrow">${escapeHTML(character.name)}／${escapeHTML(line.role || "")}</p>
            <h1>${escapeHTML(line.name)}</h1>
            <p class="lead">${escapeHTML(line.description || "")}</p>
            <blockquote>「${escapeHTML(line.quote || character.quote || "")}」</blockquote>
          </div>
        </section>
        <section class="content-columns">
          <article class="panel content-panel">
            <p class="eyebrow">DIVERGENCE</p><h2>世界線分歧點</h2>
            <div class="divergence-note"><strong>${escapeHTML(line.divergence || "尚未設定")}</strong></div>
            <a class="text-link back-link" href="${hrefCharacter(world, character)}" data-route>返回角色主線</a>
          </article>
          <aside class="panel content-panel">
            <p class="eyebrow">IF PROFILE</p><h2>此世界線資料</h2>
            ${profileRows(line.profile)}
          </aside>
        </section>
      </div>`;
  }

  function renderMissing() {
    return `
      <section class="panel not-found">
        <div><p class="eyebrow">404</p><h1>找不到檔案</h1><p>網址可能有誤，或該世界與角色已被移除。</p><a class="text-link" href="#/" data-route>返回世界首頁</a></div>
      </section>`;
  }

  function render() {
    const context = routeData();
    applyTheme(context);

    let html = "";
    if (context.page === "home") html = renderHome();
    else if (context.page === "world") html = renderWorld(context.world);
    else if (context.page === "character") html = renderCharacter(context.world, context.character);
    else if (context.page === "if") html = renderIf(context.world, context.character, context.ifLine);
    else html = renderMissing();

    app.innerHTML = html;
    const pageTitle = context.ifLine?.name || context.character?.name || context.world?.name || data.site?.title || "OC 檔案館";
    document.title = context.page === "home" ? pageTitle : `${pageTitle}｜${data.site?.title || "OC 檔案館"}`;
  }

  function renderWithTransition() {
    const update = () => {
      render();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };

    if (document.startViewTransition && !reduceMotion.matches) {
      document.startViewTransition(update);
      return;
    }

    app.classList.add("is-leaving");
    window.setTimeout(() => {
      update();
      app.classList.remove("is-leaving");
      app.classList.add("is-entering");
      window.setTimeout(() => app.classList.remove("is-entering"), 450);
    }, reduceMotion.matches ? 0 : 150);
  }

  window.addEventListener("hashchange", renderWithTransition);
  render();
})();
