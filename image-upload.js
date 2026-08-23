(() => {
  "use strict";

  const formRoot = document.getElementById("editor-form");
  const toast = document.getElementById("editor-toast");
  if (!formRoot) return;

  const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
  const RULES = {
    cover: { maxDimension: 1920, targetBytes: 260 * 1024, label: "世界封面" },
    image: { maxDimension: 1600, targetBytes: 180 * 1024, label: "角色圖片" }
  };

  let uploadCounter = 0;
  let toastTimer = 0;

  function notify(message, kind = "normal") {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.kind = kind;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function isEmbeddedImage(value) {
    return /^data:image\//i.test(String(value || ""));
  }

  function imageNameForKey(key) {
    if (key === "cover") return "世界封面";
    const heading = formRoot.querySelector(".editor-selection-head small")?.textContent || "";
    return heading.includes("IF") ? "IF 圖片" : "角色圖片";
  }

  function createPreview(value, label) {
    const preview = document.createElement("div");
    preview.className = "image-upload-preview";

    if (!value) {
      const empty = document.createElement("div");
      empty.className = "image-upload-empty";
      empty.innerHTML = `<span aria-hidden="true">＋</span><small>尚未選擇${label}</small>`;
      preview.append(empty);
      return preview;
    }

    const image = document.createElement("img");
    image.alt = `${label}預覽`;
    image.decoding = "async";
    image.src = value;
    image.addEventListener("error", () => {
      preview.replaceChildren();
      const broken = document.createElement("div");
      broken.className = "image-upload-empty is-error";
      broken.innerHTML = "<span aria-hidden=\"true\">!</span><small>圖片無法讀取</small>";
      preview.append(broken);
    }, { once: true });
    preview.append(image);
    return preview;
  }

  function dataUrlToBlob(dataUrl) {
    const [header, encoded] = dataUrl.split(",");
    const mime = header.match(/data:([^;]+)/i)?.[1] || "application/octet-stream";
    const binary = atob(encoded || "");
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mime });
  }

  function canvasToBlob(canvas, type, quality) {
    if (typeof canvas.toBlob === "function") {
      return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    }

    try {
      return Promise.resolve(dataUrlToBlob(canvas.toDataURL(type, quality)));
    } catch {
      return Promise.resolve(null);
    }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("read-failed"));
      reader.readAsDataURL(blob);
    });
  }

  async function decodeImage(file) {
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => bitmap.close?.()
        };
      } catch {
        // Safari 對部分格式不支援 createImageBitmap，改用 Image。
      }
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const node = new Image();
        node.onload = () => resolve(node);
        node.onerror = () => reject(new Error("decode-failed"));
        node.src = objectUrl;
      });
      return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        cleanup: () => URL.revokeObjectURL(objectUrl)
      };
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }
  }

  function drawCanvas(source, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("canvas-unavailable");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function encodeCanvas(canvas, file, quality) {
    const webp = await canvasToBlob(canvas, "image/webp", quality);
    if (webp && webp.type === "image/webp") return webp;

    const fallbackType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const fallback = await canvasToBlob(canvas, fallbackType, quality);
    if (!fallback) throw new Error("encode-failed");
    return fallback;
  }

  async function compressImage(file, key) {
    if (!file || !String(file.type).startsWith("image/")) throw new Error("not-image");
    if (file.type === "image/svg+xml") throw new Error("svg-not-supported");
    if (file.size > MAX_SOURCE_BYTES) throw new Error("source-too-large");

    const rule = RULES[key] || RULES.image;
    const decoded = await decodeImage(file);

    try {
      if (!decoded.width || !decoded.height) throw new Error("invalid-dimensions");

      let maxDimension = rule.maxDimension;
      let quality = 0.86;
      let output = null;
      let outputWidth = decoded.width;
      let outputHeight = decoded.height;

      for (let attempt = 0; attempt < 11; attempt += 1) {
        const scale = Math.min(1, maxDimension / Math.max(decoded.width, decoded.height));
        outputWidth = Math.max(1, Math.round(decoded.width * scale));
        outputHeight = Math.max(1, Math.round(decoded.height * scale));
        const canvas = drawCanvas(decoded.source, outputWidth, outputHeight);
        output = await encodeCanvas(canvas, file, quality);

        if (output.size <= rule.targetBytes || Math.max(outputWidth, outputHeight) <= 640) break;

        if (quality > 0.58 && output.type !== "image/png") {
          quality = Math.max(0.5, quality - 0.08);
        } else {
          maxDimension = Math.max(640, Math.round(maxDimension * 0.84));
          quality = 0.78;
        }
      }

      if (!output) throw new Error("encode-failed");
      return {
        dataUrl: await blobToDataUrl(output),
        bytes: output.size,
        width: outputWidth,
        height: outputHeight,
        type: output.type
      };
    } finally {
      decoded.cleanup?.();
    }
  }

  async function applyImageFile(file, pathInput, uploader, key) {
    const chooseButton = uploader.querySelector("[data-image-choose]");
    const status = uploader.querySelector(".image-upload-status");
    const originalText = chooseButton?.textContent || "選擇圖片";

    uploader.dataset.processing = "true";
    if (chooseButton) {
      chooseButton.disabled = true;
      chooseButton.textContent = "處理中…";
    }
    if (status) status.textContent = "正在壓縮圖片，請不要關閉頁面。";

    try {
      const result = await compressImage(file, key);
      pathInput.value = result.dataUrl;
      pathInput.dispatchEvent(new Event("input", { bubbles: true }));
      refreshUploader(uploader, pathInput, key);

      const animationNote = file.type === "image/gif" ? "；GIF 會使用第一幀" : "";
      notify(`圖片已加入並壓縮為 ${formatBytes(result.bytes)}（${result.width}×${result.height}）${animationNote}。`, "success");
    } catch (error) {
      const messages = {
        "not-image": "請選擇圖片檔案。",
        "svg-not-supported": "暫不支援 SVG，請改用 PNG、JPG、WebP 或 GIF。",
        "source-too-large": "原圖超過 30 MB，請先縮小後再選擇。",
        "decode-failed": "瀏覽器無法讀取這個圖片格式；HEIC 可先轉成 JPG 或 PNG。",
        "invalid-dimensions": "圖片尺寸無法辨識。",
        "canvas-unavailable": "瀏覽器無法處理這張圖片。",
        "encode-failed": "圖片壓縮失敗，請換一張圖片再試。",
        "read-failed": "圖片讀取失敗，請重新選擇。"
      };
      notify(messages[error?.message] || "圖片處理失敗，請換一張圖片再試。", "warning");
    } finally {
      uploader.dataset.processing = "false";
      if (chooseButton) {
        chooseButton.disabled = false;
        chooseButton.textContent = originalText;
      }
      const fileInput = uploader.querySelector("input[type=\"file\"]");
      if (fileInput) fileInput.value = "";
    }
  }

  function refreshUploader(uploader, pathInput, key) {
    const label = imageNameForKey(key);
    const value = pathInput.value.trim();
    const previewSlot = uploader.querySelector(".image-upload-preview-slot");
    const status = uploader.querySelector(".image-upload-status");
    const removeButton = uploader.querySelector("[data-image-remove]");
    const chooseButton = uploader.querySelector("[data-image-choose]");

    previewSlot?.replaceChildren(createPreview(value, label));
    if (status) {
      status.textContent = value
        ? (isEmbeddedImage(value) ? "已直接內嵌在網站資料中，發布後訪客可正常看到。" : "目前使用既有圖片路徑。")
        : "可從相簿或檔案中選擇，系統會自動壓縮並儲存。";
    }
    if (removeButton) removeButton.hidden = !value;
    if (chooseButton) chooseButton.textContent = value ? "更換圖片" : "選擇圖片";
  }

  function enhanceImageField(pathInput) {
    const oldField = pathInput.closest("label.editor-field, .editor-field");
    if (!oldField || oldField.dataset.imageUploaderReady === "1") return;

    const key = pathInput.dataset.field;
    if (!RULES[key]) return;

    const label = imageNameForKey(key);
    const titleNode = [...oldField.children].find((node) => node.tagName === "SPAN");
    const fieldTitle = titleNode?.textContent?.replace(/路徑/g, "") || label;

    const field = document.createElement("div");
    field.className = oldField.className;
    field.classList.add("has-image-uploader", "wide");
    field.dataset.imageUploaderReady = "1";

    const heading = document.createElement("span");
    heading.textContent = fieldTitle;
    field.append(heading);

    const uploader = document.createElement("div");
    uploader.className = "inline-image-uploader";
    uploader.dataset.imageKey = key;

    const previewSlot = document.createElement("div");
    previewSlot.className = "image-upload-preview-slot";

    const controls = document.createElement("div");
    controls.className = "image-upload-controls";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.className = "image-upload-file-input";
    fileInput.id = `oc-image-upload-${++uploadCounter}`;

    const chooseButton = document.createElement("button");
    chooseButton.type = "button";
    chooseButton.className = "image-upload-button primary";
    chooseButton.dataset.imageChoose = "";
    chooseButton.textContent = pathInput.value.trim() ? "更換圖片" : "選擇圖片";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "image-upload-button danger";
    removeButton.dataset.imageRemove = "";
    removeButton.textContent = "移除圖片";

    const status = document.createElement("p");
    status.className = "image-upload-status";

    controls.append(fileInput, chooseButton, removeButton, status);
    uploader.append(previewSlot, controls);

    const details = document.createElement("details");
    details.className = "image-path-fallback";
    const summary = document.createElement("summary");
    summary.textContent = "進階：改用圖片路徑或網址";
    const pathHelp = document.createElement("small");
    pathHelp.textContent = "一般不需要填寫。直接上傳的圖片會自動轉成可發布的內嵌資料。";
    pathInput.setAttribute("aria-label", `${label}路徑`);
    details.append(summary, pathInput, pathHelp);

    oldField.replaceWith(field);
    field.append(uploader, details);

    chooseButton.addEventListener("click", () => fileInput.click());
    removeButton.addEventListener("click", () => {
      pathInput.value = "";
      pathInput.dispatchEvent(new Event("input", { bubbles: true }));
      refreshUploader(uploader, pathInput, key);
      notify(`${label}已移除。`, "success");
    });
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file) applyImageFile(file, pathInput, uploader, key);
    });
    pathInput.addEventListener("input", () => refreshUploader(uploader, pathInput, key));

    ["dragenter", "dragover"].forEach((eventName) => {
      uploader.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploader.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      uploader.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploader.classList.remove("is-dragging");
      });
    });
    uploader.addEventListener("drop", (event) => {
      const file = [...(event.dataTransfer?.files || [])].find((item) => item.type.startsWith("image/"));
      if (file) applyImageFile(file, pathInput, uploader, key);
      else notify("請拖入圖片檔案。", "warning");
    });

    refreshUploader(uploader, pathInput, key);
  }

  function installUploaders() {
    formRoot.querySelectorAll('input[data-field="cover"], input[data-field="image"]').forEach(enhanceImageField);
  }

  const observer = new MutationObserver(() => installUploaders());
  observer.observe(formRoot, { childList: true, subtree: true });
  installUploaders();
})();
