(() => {
  "use strict";

  const STORAGE_KEY = "about-my-oc-editor-draft-v1";
  const REPOSITORY_KEY = "about-my-oc-editor-repository";
  const THEMES = [
    ["archive", "檔案館"],
    ["ancient", "古風"],
    ["cyber", "科技風"],
    ["zombie", "喪屍風"],
    ["fantasy", "西幻風"],
    ["school", "校園風"]
  ];

  const formRoot = document.getElementById("editor-form");
  const treeRoot = document.getElementById("world-tree");
  const treeEmpty = document.getElementById("world-tree-empty");
  const previewRoot = document.getElementById("editor-preview");
  const draftStatus = document.getElementById("draft-status");
  const toast = document.getElementById("editor-toast");
  const importInput = document.getElementById("import-file-input");

  const publishedData = normalizeData(clone(window.OC_SITE_DATA || {}));
  let data = loadDraft() || clone(publishedData);
  let selection = { type: "site" };
  let saveTimer = 0;
  let toastTimer = 0;

  function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeData(input) {
    const source = input && typeof input === "object" ? clone(input) : {};
    source.site = {
      title: "我的 OC 檔案館",
      tagline: "Worlds, Characters & IF Lines",
      mark: "OC",
      introTitle: "開始建立你的世界",
      introText: "目前尚未建立任何世界。",
      footer: "About My OC",
      ...(source.site || {})
    };

    source.worlds = Array.isArray(source.worlds) ? source.worlds : [];
    source.worlds = source.worlds.map((world, worldIndex) => {
      const normalizedWorld = {
        id: `world-${worldIndex + 1}`,
        name: "未命名世界",
        subtitle: "NEW WORLD",
        theme: "archive",
        symbol: "界",
        cover: "",
        description: "",
        facts: [],
        characters: [],
        ...(world || {})
      };
      normalizedWorld.facts = Array.isArray(normalizedWorld.facts) ? normalizedWorld.facts : [];
      normalizedWorld.characters = Array.isArray(normalizedWorld.characters) ? normalizedWorld.characters : [];
      normalizedWorld.characters = normalizedWorld.characters.map((character, characterIndex) => {
        const normalizedCharacter = {
          id: `character-${characterIndex + 1}`,
          name: "未命名角色",
          englishName: "",
          role: "",
          image: "",
          quote: "",
          tags: [],
          profile: [],
          story: [],
          relationships: [],
          ifLines: [],
          ...(character || {})
        };
        normalizedCharacter.tags = Array.isArray(normalizedCharacter.tags) ? normalizedCharacter.tags : [];
        normalizedCharacter.profile = Array.isArray(normalizedCharacter.profile) ? normalizedCharacter.profile : [];
        normalizedCharacter.story = Array.isArray(normalizedCharacter.story) ? normalizedCharacter.story : [];
        normalizedCharacter.relationships = Array.isArray(normalizedCharacter.relationships) ? normalizedCharacter.relationships : [];
        normalizedCharacter.ifLines = Array.isArray(normalizedCharacter.ifLines) ? normalizedCharacter.ifLines : [];
        normalizedCharacter.ifLines = normalizedCharacter.ifLines.map((line, lineIndex) => ({
          id: `if-${lineIndex + 1}`,
          name: "未命名 IF",
          theme: normalizedWorld.theme || "archive",
          role: "",
          image: "",
          divergence: "",
          description: "",
          quote: "",
          profile: [],
          ...(line || {}),
          profile: Array.isArray(line?.profile) ? line.profile : []
        }));
        return normalizedCharacter;
      });
      return normalizedWorld;
    });
    return source;
  }

  function loadDraft() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      const payload = parsed?.data || parsed;
      if (!payload || !Array.isArray(payload.worlds)) return null;
      const savedAt = parsed?.savedAt;
      if (savedAt) draftStatus.textContent = `已載入草稿：${formatTime(savedAt)}`;
      return normalizeData(payload);
    } catch {
      return null;
    }
  }

  function formatTime(value) {
    try {
      return new Intl.DateTimeFormat("zh-Hant", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(new Date(value));
    } catch {
      return "剛剛";
    }
  }

  function saveDraft(showMessage = false) {
    window.clearTimeout(saveTimer);
    try {
      const savedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt, data }));
      draftStatus.textContent = `已自動儲存：${formatTime(savedAt)}`;
      if (showMessage) showToast("草稿已儲存在這個瀏覽器。", "success");
    } catch {
      draftStatus.textContent = "無法儲存草稿";
      if (showMessage) showToast("瀏覽器無法儲存草稿，請下載 data.js 備份。", "warning");
    }
  }

  function queueSave() {
    draftStatus.textContent = "正在儲存…";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => saveDraft(false), 260);
  }

  function showToast(message, kind = "normal") {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.kind = kind;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function attr(value = "") {
    return escapeHTML(value).replaceAll("`", "&#096;");
  }

  function nextId(prefix, items) {
    const used = new Set((items || []).map((item) => String(item.id || "")));
    let number = 1;
    while (used.has(`${prefix}-${number}`)) number += 1;
    return `${prefix}-${number}`;
  }

  function createWorld() {
    return {
      id: nextId("world", data.worlds),
      name: "未命名世界",
      subtitle: "NEW WORLD",
      theme: "archive",
      symbol: "界",
      cover: "",
      description: "",
      facts: [],
      characters: []
    };
  }

  function createCharacter(world) {
    return {
      id: nextId("character", world.characters),
      name: "未命名角色",
      englishName: "",
      role: "",
      image: "",
      quote: "",
      tags: [],
      profile: [],
      story: [],
      relationships: [],
      ifLines: []
    };
  }

  function createIfLine(character, world) {
    return {
      id: nextId("if", character.ifLines),
      name: "未命名 IF",
      theme: world.theme || "archive",
      role: "",
      image: "",
      divergence: "",
      description: "",
      quote: "",
      profile: []
    };
  }

  function getContext() {
    if (selection.type === "site") return { type: "site", target: data.site };
    const world = data.worlds[selection.worldIndex];
    if (!world) {
      selection = { type: "site" };
      return { type: "site", target: data.site };
    }
    if (selection.type === "world") return { type: "world", world, target: world };
    const character = world.characters?.[selection.characterIndex];
    if (!character) {
      selection = { type: "world", worldIndex: selection.worldIndex };
      return { type: "world", world, target: world };
    }
    if (selection.type === "character") return { type: "character", world, character, target: character };
    const ifLine = character.ifLines?.[selection.ifIndex];
    if (!ifLine) {
      selection = { type: "character", worldIndex: selection.worldIndex, characterIndex: selection.characterIndex };
      return { type: "character", world, character, target: character };
    }
    return { type: "if", world, character, ifLine, target: ifLine };
  }

  function isActive(type, worldIndex, characterIndex, ifIndex) {
    return selection.type === type
      && (worldIndex === undefined || selection.worldIndex === worldIndex)
      && (characterIndex === undefined || selection.characterIndex === characterIndex)
      && (ifIndex === undefined || selection.ifIndex === ifIndex);
  }

  function renderTree() {
    const siteButton = document.querySelector('[data-select-type="site"]');
    siteButton?.classList.toggle("is-active", selection.type === "site");
    treeEmpty.hidden = data.worlds.length > 0;

    treeRoot.innerHTML = data.worlds.map((world, worldIndex) => {
      const characters = (world.characters || []).map((character, characterIndex) => {
        const lines = (character.ifLines || []).map((line, ifIndex) => `
          <button class="tree-item ${isActive("if", worldIndex, characterIndex, ifIndex) ? "is-active" : ""}" type="button"
            data-select-type="if" data-world-index="${worldIndex}" data-character-index="${characterIndex}" data-if-index="${ifIndex}">
            <span>↳ ${escapeHTML(line.name || "未命名 IF")}</span>
          </button>`).join("");

        return `
          <div>
            <button class="tree-item ${isActive("character", worldIndex, characterIndex) ? "is-active" : ""}" type="button"
              data-select-type="character" data-world-index="${worldIndex}" data-character-index="${characterIndex}">
              <span>${escapeHTML(character.name || "未命名角色")}</span>
              <small>${escapeHTML(character.role || character.englishName || "角色")}</small>
            </button>
            ${lines ? `<div class="tree-if-list">${lines}</div>` : ""}
          </div>`;
      }).join("");

      return `
        <div class="tree-world">
          <button class="tree-item ${isActive("world", worldIndex) ? "is-active" : ""}" type="button"
            data-select-type="world" data-world-index="${worldIndex}">
            <span>${escapeHTML(world.name || "未命名世界")}</span>
            <small>${escapeHTML(world.subtitle || world.id || "世界")}</small>
          </button>
          ${characters ? `<div class="tree-character-list">${characters}</div>` : ""}
        </div>`;
    }).join("");
  }

  function field(label, key, value, options = {}) {
    const classes = `editor-field${options.wide ? " wide" : ""}`;
    const help = options.help ? `<small>${escapeHTML(options.help)}</small>` : "";
    let control = "";

    if (options.type === "textarea") {
      control = `<textarea data-field="${attr(key)}"${options.transform ? ` data-transform="${attr(options.transform)}"` : ""} rows="${options.rows || 5}" placeholder="${attr(options.placeholder || "")}">${escapeHTML(value || "")}</textarea>`;
    } else if (options.type === "select") {
      const choices = options.choices || [];
      control = `<select data-field="${attr(key)}">${choices.map(([choiceValue, choiceLabel]) => `
        <option value="${attr(choiceValue)}" ${String(value) === String(choiceValue) ? "selected" : ""}>${escapeHTML(choiceLabel)}</option>`).join("")}</select>`;
    } else {
      control = `<input data-field="${attr(key)}"${options.transform ? ` data-transform="${attr(options.transform)}"` : ""} type="${attr(options.type || "text")}" value="${attr(value || "")}" placeholder="${attr(options.placeholder || "")}">`;
    }

    return `<label class="${classes}"><span>${escapeHTML(label)}</span>${control}${help}</label>`;
  }

  function selectionHead(kicker, title, description, actions = "") {
    return `
      <header class="editor-selection-head">
        <div>
          <small>${escapeHTML(kicker)}</small>
          <h1>${escapeHTML(title)}</h1>
          <p>${escapeHTML(description)}</p>
        </div>
        ${actions ? `<div class="selection-actions">${actions}</div>` : ""}
      </header>`;
  }

  function section(title, description, content, action = "") {
    return `
      <section class="editor-section">
        <div class="editor-section-heading">
          <div><h2>${escapeHTML(title)}</h2>${description ? `<p>${escapeHTML(description)}</p>` : ""}</div>
          ${action}
        </div>
        ${content}
      </section>`;
  }

  function pairRows(items, arrayName, firstLabel = "欄位名稱", secondLabel = "內容") {
    if (!items.length) return '<div class="repeat-empty">目前沒有資料欄位。</div>';
    return `<div class="repeat-list">${items.map((item, index) => `
      <div class="repeat-row">
        <input aria-label="${attr(firstLabel)}" data-array="${attr(arrayName)}" data-index="${index}" data-key="label" value="${attr(item.label || "")}" placeholder="${attr(firstLabel)}">
        <input aria-label="${attr(secondLabel)}" data-array="${attr(arrayName)}" data-index="${index}" data-key="value" value="${attr(item.value || "")}" placeholder="${attr(secondLabel)}">
        <button type="button" data-action="remove-array-row" data-array="${attr(arrayName)}" data-index="${index}" aria-label="刪除此列">刪除</button>
      </div>`).join("")}</div>`;
  }

  function relationshipRows(items) {
    if (!items.length) return '<div class="repeat-empty">目前沒有角色關係。</div>';
    return `<div class="repeat-list">${items.map((item, index) => `
      <div class="repeat-row relationship">
        <input aria-label="角色名稱" data-array="relationships" data-index="${index}" data-key="name" value="${attr(item.name || "")}" placeholder="角色名稱">
        <input aria-label="關係" data-array="relationships" data-index="${index}" data-key="relation" value="${attr(item.relation || "")}" placeholder="關係">
        <input aria-label="關係補充" data-array="relationships" data-index="${index}" data-key="note" value="${attr(item.note || "")}" placeholder="關係補充">
        <button type="button" data-action="remove-array-row" data-array="relationships" data-index="${index}" aria-label="刪除此列">刪除</button>
      </div>`).join("")}</div>`;
  }

  function renderSiteForm() {
    formRoot.innerHTML = `
      ${selectionHead("WEBSITE SETTINGS", "網站設定", "修改網站名稱、首頁介紹與頁尾。這些內容會套用到所有世界。")}
      ${section("基本資料", "公開網站最外層顯示的內容。", `
        <div class="editor-form-grid">
          ${field("網站名稱", "title", data.site.title, { placeholder: "我的 OC 檔案館" })}
          ${field("英文副標題", "tagline", data.site.tagline, { placeholder: "Worlds, Characters & IF Lines" })}
          ${field("左上角標誌", "mark", data.site.mark, { placeholder: "OC" })}
          ${field("首頁大標題", "introTitle", data.site.introTitle, { placeholder: "選擇一個世界" })}
          ${field("首頁介紹", "introText", data.site.introText, { type: "textarea", wide: true, rows: 4 })}
          ${field("頁尾文字", "footer", data.site.footer, { wide: true })}
        </div>`)}
      <div class="editor-help">新增世界請按左側「世界與角色」旁邊的 <strong>＋</strong>。草稿會自動保存在目前瀏覽器。</div>`;
  }

  function renderWorldForm(context) {
    const { world } = context;
    const worldIndex = selection.worldIndex;
    const characterButtons = world.characters.length
      ? `<div class="repeat-list">${world.characters.map((character, characterIndex) => `
          <button class="tree-item" type="button" data-action="select-character" data-character-index="${characterIndex}">
            <span>${escapeHTML(character.name)}</span><small>${escapeHTML(character.role || "角色")}</small>
          </button>`).join("")}</div>`
      : '<div class="repeat-empty">這個世界還沒有角色。</div>';

    formRoot.innerHTML = `
      ${selectionHead("WORLD", world.name || "未命名世界", "設定世界首頁、視覺風格與所屬角色。", `
        <button class="editor-button ghost" type="button" data-action="duplicate-world">複製世界</button>
        <button class="editor-button danger" type="button" data-action="delete-world">刪除世界</button>`)}
      ${section("世界基本資料", "世界 ID 會出現在網址中，建立後盡量不要頻繁修改。", `
        <div class="editor-form-grid">
          ${field("世界名稱", "name", world.name)}
          ${field("世界 ID", "id", world.id, { help: "只能使用小寫英文、數字與連字號，例如 moon-shrine。" })}
          ${field("英文副標題", "subtitle", world.subtitle)}
          ${field("頁面風格", "theme", world.theme, { type: "select", choices: THEMES })}
          ${field("世界標誌", "symbol", world.symbol, { placeholder: "界" })}
          ${field("封面圖片路徑", "cover", world.cover, { placeholder: "assets/worlds/cover.webp" })}
          ${field("世界簡介", "description", world.description, { type: "textarea", wide: true, rows: 5 })}
        </div>`)}
      ${section("世界資料欄", "可自由新增世界類型、主要地點、時代等欄位。", pairRows(world.facts, "facts"), '<button class="mini-button" type="button" data-action="add-fact">＋ 新增資料欄</button>')}
      ${section("所屬角色", `${world.characters.length} 名角色`, characterButtons, '<button class="mini-button" type="button" data-action="add-character">＋ 新增角色</button>')}
      <div class="editor-help">目前正在編輯第 ${worldIndex + 1} 個世界。圖片請先放入 <code>assets</code>，再填入相對路徑。</div>`;
  }

  function renderCharacterForm(context) {
    const { world, character } = context;
    const ifButtons = character.ifLines.length
      ? `<div class="repeat-list">${character.ifLines.map((line, ifIndex) => `
          <button class="tree-item" type="button" data-action="select-if" data-if-index="${ifIndex}">
            <span>${escapeHTML(line.name)}</span><small>${escapeHTML(line.role || "IF 世界線")}</small>
          </button>`).join("")}</div>`
      : '<div class="repeat-empty">這名角色目前沒有 IF 線。</div>';

    formRoot.innerHTML = `
      ${selectionHead("CHARACTER", character.name || "未命名角色", `所屬世界：${world.name}`, `
        <button class="editor-button ghost" type="button" data-action="duplicate-character">複製角色</button>
        <button class="editor-button danger" type="button" data-action="delete-character">刪除角色</button>`)}
      ${section("角色基本資料", "角色卡與角色介紹頁最上方顯示的內容。", `
        <div class="editor-form-grid">
          ${field("角色名稱", "name", character.name)}
          ${field("角色 ID", "id", character.id, { help: "只能使用小寫英文、數字與連字號。" })}
          ${field("英文名／代號", "englishName", character.englishName)}
          ${field("身分／職業", "role", character.role)}
          ${field("角色圖片路徑", "image", character.image, { wide: true, placeholder: "assets/characters/character.webp" })}
          ${field("代表台詞", "quote", character.quote, { type: "textarea", wide: true, rows: 3 })}
          ${field("標籤", "tags", character.tags.join("、"), { wide: true, transform: "tags", help: "使用逗號、頓號或換行分隔。" })}
        </div>`)}
      ${section("基本資料欄", "生日、種族、身高、能力等資料。", pairRows(character.profile, "profile"), '<button class="mini-button" type="button" data-action="add-profile">＋ 新增資料欄</button>')}
      ${section("角色故事", "以空白行分隔段落。", `
        <div class="editor-form-grid">
          ${field("故事內容", "story", character.story.join("\n\n"), { type: "textarea", transform: "paragraphs", wide: true, rows: 10 })}
        </div>`)}
      ${section("角色關係", "可寫下對方名稱、關係與補充。", relationshipRows(character.relationships), '<button class="mini-button" type="button" data-action="add-relationship">＋ 新增關係</button>')}
      ${section("IF 世界線", `${character.ifLines.length} 條 IF`, ifButtons, '<button class="mini-button" type="button" data-action="add-if">＋ 新增 IF</button>')}`;
  }

  function renderIfForm(context) {
    const { world, character, ifLine } = context;
    formRoot.innerHTML = `
      ${selectionHead("IF WORLD LINE", ifLine.name || "未命名 IF", `${world.name}／${character.name}`, `
        <button class="editor-button ghost" type="button" data-action="duplicate-if">複製 IF</button>
        <button class="editor-button danger" type="button" data-action="delete-if">刪除 IF</button>`)}
      ${section("IF 基本資料", "設定這條平行世界線中的角色身分與視覺風格。", `
        <div class="editor-form-grid">
          ${field("IF 名稱", "name", ifLine.name)}
          ${field("IF ID", "id", ifLine.id, { help: "只能使用小寫英文、數字與連字號。" })}
          ${field("角色身分", "role", ifLine.role)}
          ${field("頁面風格", "theme", ifLine.theme, { type: "select", choices: THEMES })}
          ${field("IF 圖片路徑", "image", ifLine.image, { wide: true, placeholder: "assets/characters/character-if.webp" })}
          ${field("世界線分歧點", "divergence", ifLine.divergence, { type: "textarea", wide: true, rows: 4 })}
          ${field("IF 簡介", "description", ifLine.description, { type: "textarea", wide: true, rows: 5 })}
          ${field("IF 代表台詞", "quote", ifLine.quote, { type: "textarea", wide: true, rows: 3 })}
        </div>`)}
      ${section("IF 資料欄", "此世界線專用的身分、年級、職業等資料。", pairRows(ifLine.profile, "profile"), '<button class="mini-button" type="button" data-action="add-profile">＋ 新增資料欄</button>')}`;
  }

  function renderForm() {
    const context = getContext();
    if (context.type === "site") renderSiteForm();
    else if (context.type === "world") renderWorldForm(context);
    else if (context.type === "character") renderCharacterForm(context);
    else renderIfForm(context);
  }

  function previewCard(kicker, title, description, meta = []) {
    return `
      <article class="preview-card">
        <small>${escapeHTML(kicker)}</small>
        <h3>${escapeHTML(title || "未命名")}</h3>
        ${description ? `<p>${escapeHTML(description)}</p>` : ""}
        ${meta.length ? `<div class="preview-meta">${meta.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>` : ""}
      </article>`;
  }

  function renderPreview() {
    const context = getContext();
    let html = "";

    if (context.type === "site") {
      html = data.worlds.length
        ? `<div class="preview-stack">${data.worlds.map((world) => previewCard(
            world.subtitle || "WORLD",
            world.name,
            world.description,
            [`${world.characters.length} 名角色`, `${world.characters.reduce((sum, character) => sum + character.ifLines.length, 0)} 條 IF`, THEMES.find(([value]) => value === world.theme)?.[1] || world.theme]
          )).join("")}</div>`
        : '<div class="preview-empty">尚未建立世界。新增後會在這裡顯示摘要。</div>';
    } else if (context.type === "world") {
      html = `<div class="preview-stack">${previewCard(
        context.world.subtitle || "WORLD",
        context.world.name,
        context.world.description,
        [`${context.world.characters.length} 名角色`, `${context.world.facts.length} 個資料欄`, THEMES.find(([value]) => value === context.world.theme)?.[1] || context.world.theme]
      )}${context.world.characters.map((character) => previewCard("CHARACTER", character.name, character.role, character.tags.slice(0, 3))).join("")}</div>`;
    } else if (context.type === "character") {
      html = `<div class="preview-stack">${previewCard(
        context.character.englishName || "CHARACTER",
        context.character.name,
        context.character.role,
        [...context.character.tags.slice(0, 3), `${context.character.ifLines.length} 條 IF`]
      )}${context.character.ifLines.map((line) => previewCard("IF WORLD LINE", line.name, line.description, [line.role, THEMES.find(([value]) => value === line.theme)?.[1] || line.theme].filter(Boolean))).join("")}</div>`;
    } else {
      html = `<div class="preview-stack">${previewCard(
        "IF WORLD LINE",
        context.ifLine.name,
        context.ifLine.description,
        [context.ifLine.role, context.ifLine.divergence, THEMES.find(([value]) => value === context.ifLine.theme)?.[1] || context.ifLine.theme].filter(Boolean)
      )}</div>`;
    }

    previewRoot.innerHTML = html;
  }

  function renderAll() {
    renderTree();
    renderForm();
    renderPreview();
  }

  function updateSelectedField(element) {
    const context = getContext();
    const target = context.target;
    if (!target) return;

    if (element.dataset.array) {
      const array = target[element.dataset.array];
      const item = array?.[Number(element.dataset.index)];
      if (item && element.dataset.key) item[element.dataset.key] = element.value;
      queueSave();
      renderPreview();
      return;
    }

    const key = element.dataset.field;
    if (!key) return;
    const transform = element.dataset.transform;
    if (transform === "tags") {
      target[key] = element.value.split(/[，,、\n]+/).map((item) => item.trim()).filter(Boolean);
    } else if (transform === "paragraphs") {
      target[key] = element.value.split(/\n\s*\n+/).map((item) => item.trim()).filter(Boolean);
    } else {
      target[key] = element.value;
    }

    queueSave();
    renderPreview();
    if (["name", "id", "role", "subtitle"].includes(key)) renderTree();
  }

  function mutateAndRender(message = "") {
    saveDraft(false);
    renderAll();
    if (message) showToast(message, "success");
  }

  function handleAction(actionButton) {
    const action = actionButton.dataset.action;
    const context = getContext();

    if (action === "add-fact" && context.type === "world") {
      context.world.facts.push({ label: "", value: "" });
      mutateAndRender();
    } else if (action === "add-profile" && ["character", "if"].includes(context.type)) {
      context.target.profile.push({ label: "", value: "" });
      mutateAndRender();
    } else if (action === "add-relationship" && context.type === "character") {
      context.character.relationships.push({ name: "", relation: "", note: "" });
      mutateAndRender();
    } else if (action === "remove-array-row") {
      const array = context.target?.[actionButton.dataset.array];
      const index = Number(actionButton.dataset.index);
      if (Array.isArray(array) && Number.isInteger(index)) array.splice(index, 1);
      mutateAndRender();
    } else if (action === "add-character" && context.type === "world") {
      context.world.characters.push(createCharacter(context.world));
      selection = { type: "character", worldIndex: selection.worldIndex, characterIndex: context.world.characters.length - 1 };
      mutateAndRender("已新增角色。");
    } else if (action === "add-if" && context.type === "character") {
      context.character.ifLines.push(createIfLine(context.character, context.world));
      selection = { ...selection, type: "if", ifIndex: context.character.ifLines.length - 1 };
      mutateAndRender("已新增 IF 世界線。");
    } else if (action === "select-character" && context.type === "world") {
      selection = { type: "character", worldIndex: selection.worldIndex, characterIndex: Number(actionButton.dataset.characterIndex) };
      renderAll();
    } else if (action === "select-if" && context.type === "character") {
      selection = { ...selection, type: "if", ifIndex: Number(actionButton.dataset.ifIndex) };
      renderAll();
    } else if (action === "duplicate-world" && context.type === "world") {
      const copy = clone(context.world);
      copy.id = nextId("world", data.worlds);
      copy.name = `${copy.name} 複製`;
      data.worlds.splice(selection.worldIndex + 1, 0, copy);
      selection = { type: "world", worldIndex: selection.worldIndex + 1 };
      mutateAndRender("已複製世界。");
    } else if (action === "duplicate-character" && context.type === "character") {
      const copy = clone(context.character);
      copy.id = nextId("character", context.world.characters);
      copy.name = `${copy.name} 複製`;
      context.world.characters.splice(selection.characterIndex + 1, 0, copy);
      selection = { type: "character", worldIndex: selection.worldIndex, characterIndex: selection.characterIndex + 1 };
      mutateAndRender("已複製角色。");
    } else if (action === "duplicate-if" && context.type === "if") {
      const copy = clone(context.ifLine);
      copy.id = nextId("if", context.character.ifLines);
      copy.name = `${copy.name} 複製`;
      context.character.ifLines.splice(selection.ifIndex + 1, 0, copy);
      selection = { ...selection, ifIndex: selection.ifIndex + 1 };
      mutateAndRender("已複製 IF。");
    } else if (action === "delete-world" && context.type === "world") {
      if (!window.confirm(`確定刪除世界「${context.world.name}」及其中所有角色嗎？`)) return;
      data.worlds.splice(selection.worldIndex, 1);
      selection = { type: "site" };
      mutateAndRender("世界已刪除。");
    } else if (action === "delete-character" && context.type === "character") {
      if (!window.confirm(`確定刪除角色「${context.character.name}」及其所有 IF 嗎？`)) return;
      context.world.characters.splice(selection.characterIndex, 1);
      selection = { type: "world", worldIndex: selection.worldIndex };
      mutateAndRender("角色已刪除。");
    } else if (action === "delete-if" && context.type === "if") {
      if (!window.confirm(`確定刪除 IF「${context.ifLine.name}」嗎？`)) return;
      context.character.ifLines.splice(selection.ifIndex, 1);
      selection = { type: "character", worldIndex: selection.worldIndex, characterIndex: selection.characterIndex };
      mutateAndRender("IF 已刪除。");
    }
  }

  function buildDataJs() {
    return `/* 由 About My OC 網頁編輯器產生。 */\nwindow.OC_SITE_DATA = ${JSON.stringify(data, null, 2)};\n`;
  }

  function validateIds() {
    const errors = [];
    const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const worldIds = new Set();

    data.worlds.forEach((world, worldIndex) => {
      const worldLabel = world.name || `第 ${worldIndex + 1} 個世界`;
      if (!idPattern.test(world.id || "")) errors.push(`${worldLabel}的世界 ID 格式不正確`);
      if (worldIds.has(world.id)) errors.push(`世界 ID「${world.id}」重複`);
      worldIds.add(world.id);

      const characterIds = new Set();
      world.characters.forEach((character) => {
        if (!idPattern.test(character.id || "")) errors.push(`${worldLabel}／${character.name}的角色 ID 格式不正確`);
        if (characterIds.has(character.id)) errors.push(`${worldLabel}中的角色 ID「${character.id}」重複`);
        characterIds.add(character.id);

        const ifIds = new Set();
        character.ifLines.forEach((line) => {
          if (!idPattern.test(line.id || "")) errors.push(`${character.name}／${line.name}的 IF ID 格式不正確`);
          if (ifIds.has(line.id)) errors.push(`${character.name}中的 IF ID「${line.id}」重複`);
          ifIds.add(line.id);
        });
      });
    });

    if (errors.length) {
      window.alert(`請先修正以下問題：\n\n• ${errors.slice(0, 12).join("\n• ")}${errors.length > 12 ? `\n• 另有 ${errors.length - 12} 項` : ""}`);
      return false;
    }
    return true;
  }

  function downloadDataFile() {
    if (!validateIds()) return;
    saveDraft(false);
    const blob = new Blob([buildDataJs()], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.js";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("data.js 已下載。", "success");
  }

  async function copyText(text) {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("copy-failed");
  }

  function repositoryEditUrl() {
    if (location.hostname.endsWith(".github.io")) {
      const owner = location.hostname.split(".")[0];
      const parts = location.pathname.split("/").filter(Boolean);
      const repository = parts[0] || `${owner}.github.io`;
      return `https://github.com/${owner}/${repository}/edit/main/data.js`;
    }

    let repository = "";
    try { repository = localStorage.getItem(REPOSITORY_KEY) || ""; } catch { /* ignore */ }
    if (!repository) {
      repository = window.prompt("請貼上你的 GitHub repository 網址：", "https://github.com/Kanamememe/About_my_OC") || "";
    }
    const match = repository.trim().match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/i);
    if (!match) return "";
    try { localStorage.setItem(REPOSITORY_KEY, repository.trim()); } catch { /* ignore */ }
    return `https://github.com/${match[1]}/${match[2]}/edit/main/data.js`;
  }

  async function openPublishFlow(button) {
    if (!validateIds()) return;
    saveDraft(false);
    const editUrl = repositoryEditUrl();
    if (!editUrl) {
      showToast("無法辨識 GitHub repository，請先下載 data.js。", "warning");
      return;
    }

    const popup = window.open("about:blank", "_blank");
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "正在準備…";

    try {
      await copyText(buildDataJs());
      if (popup) popup.location.href = editUrl;
      else window.location.href = editUrl;
      showToast("data.js 已複製。到 GitHub 全選舊內容、貼上，再按 Commit changes。", "success");
    } catch {
      popup?.close();
      showToast("無法自動複製，請改用『下載 data.js』。", "warning");
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  function parseImportedText(text) {
    try {
      return JSON.parse(text);
    } catch {
      const assignment = text.indexOf("window.OC_SITE_DATA");
      const start = text.indexOf("{", assignment >= 0 ? assignment : 0);
      const end = text.lastIndexOf("}");
      if (start < 0 || end <= start) throw new Error("invalid-file");
      return JSON.parse(text.slice(start, end + 1));
    }
  }

  async function importFile(file) {
    try {
      const text = await file.text();
      const imported = parseImportedText(text);
      if (!imported || !Array.isArray(imported.worlds)) throw new Error("invalid-data");
      data = normalizeData(imported);
      selection = { type: "site" };
      saveDraft(false);
      renderAll();
      showToast("資料已匯入並儲存為本機草稿。", "success");
    } catch {
      showToast("匯入失敗。請選擇由本編輯器匯出的 data.js 或 JSON。", "warning");
    } finally {
      importInput.value = "";
    }
  }

  document.addEventListener("click", (event) => {
    const selectButton = event.target.closest("[data-select-type]");
    if (selectButton) {
      const type = selectButton.dataset.selectType;
      if (type === "site") selection = { type: "site" };
      else if (type === "world") selection = { type, worldIndex: Number(selectButton.dataset.worldIndex) };
      else if (type === "character") selection = {
        type,
        worldIndex: Number(selectButton.dataset.worldIndex),
        characterIndex: Number(selectButton.dataset.characterIndex)
      };
      else selection = {
        type: "if",
        worldIndex: Number(selectButton.dataset.worldIndex),
        characterIndex: Number(selectButton.dataset.characterIndex),
        ifIndex: Number(selectButton.dataset.ifIndex)
      };
      renderAll();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) handleAction(actionButton);
  });

  formRoot.addEventListener("input", (event) => {
    if (event.target.matches("[data-field], [data-array]")) updateSelectedField(event.target);
  });
  formRoot.addEventListener("change", (event) => {
    if (event.target.matches("select[data-field]")) updateSelectedField(event.target);
  });

  document.getElementById("add-world-button")?.addEventListener("click", () => {
    data.worlds.push(createWorld());
    selection = { type: "world", worldIndex: data.worlds.length - 1 };
    mutateAndRender("已新增世界。");
  });

  document.getElementById("save-draft-button")?.addEventListener("click", () => saveDraft(true));
  document.getElementById("download-button")?.addEventListener("click", downloadDataFile);
  document.getElementById("publish-button")?.addEventListener("click", (event) => openPublishFlow(event.currentTarget));
  document.getElementById("import-button")?.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (file) importFile(file);
  });

  document.getElementById("restore-published-button")?.addEventListener("click", () => {
    if (!window.confirm("確定用目前已發布的 data.js 覆蓋本機草稿嗎？")) return;
    data = clone(publishedData);
    selection = { type: "site" };
    saveDraft(false);
    renderAll();
    showToast("已載入目前發布內容。", "success");
  });

  document.getElementById("clear-draft-button")?.addEventListener("click", () => {
    if (!window.confirm("確定清空所有本機草稿嗎？這不會刪除已發布的網站。")) return;
    data = normalizeData({ worlds: [] });
    selection = { type: "site" };
    saveDraft(false);
    renderAll();
    showToast("本機草稿已清空。", "success");
  });

  window.addEventListener("beforeunload", () => saveDraft(false));
  renderAll();
  if (!localStorage.getItem(STORAGE_KEY)) saveDraft(false);
})();
