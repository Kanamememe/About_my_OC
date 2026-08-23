(() => {
  "use strict";

  const formRoot = document.getElementById("editor-form");
  const toast = document.getElementById("editor-toast");
  if (!formRoot) return;

  const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
  const PREVIEW_LONG_EDGE = 920;
  const RULES = {
    cover: {
      label: "世界封面",
      defaultAspect: "16:9",
      outputLongEdge: 2048,
      softLimitBytes: 1.5 * 1024 * 1024
    },
    image: {
      label: "角色圖片",
      defaultAspect: "3:4",
      outputLongEdge: 1800,
      softLimitBytes: 1.1 * 1024 * 1024
    }
  };
  const ASPECTS = [
    { value: "original", label: "保留原圖比例", ratio: null },
    { value: "1:1", label: "正方形 1:1", ratio: 1 },
    { value: "3:4", label: "直式 3:4", ratio: 3 / 4 },
    { value: "4:5", label: "直式 4:5", ratio: 4 / 5 },
    { value: "2:3", label: "直式 2:3", ratio: 2 / 3 },
    { value: "16:9", label: "橫式 16:9", ratio: 16 / 9 },
    { value: "3:2", label: "橫式 3:2", ratio: 3 / 2 }
  ];
  const QUALITY_MODES = {
    high: { label: "高清（推薦）", quality: 0.93, limitMultiplier: 1 },
    balanced: { label: "標準（較省空間）", quality: 0.86, limitMultiplier: 0.72 }
  };

  let uploadCounter = 0;
  let toastTimer = 0;

  function notify(message, kind = "normal") {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.kind = kind;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
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
    const [header, encoded] = String(dataUrl || "").split(",");
    const mime = header?.match(/data:([^;]+)/i)?.[1] || "application/octet-stream";
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

  function createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    return canvas;
  }

  function get2dContext(canvas) {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("canvas-unavailable");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    return context;
  }

  async function encodeHighQuality(canvas, sourceFile, mode, softLimitBytes) {
    const settings = QUALITY_MODES[mode] || QUALITY_MODES.high;
    const limit = softLimitBytes * settings.limitMultiplier;
    const qualities = mode === "balanced"
      ? [settings.quality, 0.83, 0.8]
      : [settings.quality, 0.91, 0.89, 0.86, 0.84];

    let output = null;
    for (const quality of qualities) {
      output = await canvasToBlob(canvas, "image/webp", quality);
      if (output && output.type === "image/webp" && output.size <= limit) break;
    }

    if (!output || output.type !== "image/webp") {
      const fallbackType = sourceFile.type === "image/png" ? "image/png" : "image/jpeg";
      output = await canvasToBlob(canvas, fallbackType, settings.quality);
    }

    if (!output) throw new Error("encode-failed");
    return output;
  }

  function validateImageFile(file) {
    if (!file || !String(file.type).startsWith("image/")) throw new Error("not-image");
    if (file.type === "image/svg+xml") throw new Error("svg-not-supported");
    if (file.size > MAX_SOURCE_BYTES) throw new Error("source-too-large");
  }

  function errorMessage(error) {
    const messages = {
      "not-image": "請選擇圖片檔案。",
      "svg-not-supported": "暫不支援 SVG，請改用 PNG、JPG、WebP 或 GIF。",
      "source-too-large": "原圖超過 40 MB，請先縮小後再選擇。",
      "decode-failed": "瀏覽器無法讀取這個圖片格式；HEIC 可先轉成 JPG 或 PNG。",
      "invalid-dimensions": "圖片尺寸無法辨識。",
      "canvas-unavailable": "瀏覽器無法處理這張圖片。",
      "encode-failed": "圖片輸出失敗，請換一張圖片再試。",
      "read-failed": "圖片讀取失敗，請重新選擇。"
    };
    return messages[error?.message] || "圖片處理失敗，請換一張圖片再試。";
  }

  function aspectRatioFor(value, decoded) {
    const found = ASPECTS.find((item) => item.value === value);
    return found?.ratio || (decoded.width / decoded.height);
  }

  function openCropEditor(file, key) {
    return new Promise(async (resolve) => {
      let decoded = null;
      let settled = false;

      try {
        validateImageFile(file);
        decoded = await decodeImage(file);
        if (!decoded.width || !decoded.height) throw new Error("invalid-dimensions");
      } catch (error) {
        decoded?.cleanup?.();
        notify(errorMessage(error), "warning");
        resolve(null);
        return;
      }

      const rule = RULES[key] || RULES.image;
      const label = imageNameForKey(key);
      const modal = document.createElement("div");
      modal.className = "crop-editor-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", `${label}剪裁`);
      modal.innerHTML = `
        <div class="crop-editor-dialog">
          <header class="crop-editor-header">
            <div>
              <small>IMAGE CROP</small>
              <h2>剪裁${label}</h2>
              <p>拖曳圖片調整位置，再用縮放控制保留想要的部分。</p>
            </div>
            <button class="crop-icon-button" type="button" data-crop-close aria-label="關閉剪裁">×</button>
          </header>
          <div class="crop-editor-layout">
            <div class="crop-editor-stage-column">
              <div class="crop-editor-stage">
                <canvas class="crop-editor-canvas" aria-label="圖片剪裁預覽"></canvas>
              </div>
              <p class="crop-editor-hint">用一根手指或滑鼠拖曳圖片；使用下方滑桿縮放。</p>
            </div>
            <div class="crop-editor-controls">
              <label class="crop-control">
                <span>裁切比例</span>
                <select data-crop-aspect>
                  ${ASPECTS.map((item) => `<option value="${item.value}" ${item.value === rule.defaultAspect ? "selected" : ""}>${item.label}</option>`).join("")}
                </select>
              </label>
              <label class="crop-control">
                <span>縮放 <output data-crop-zoom-output>100%</output></span>
                <input data-crop-zoom type="range" min="1" max="4" step="0.01" value="1">
              </label>
              <label class="crop-control">
                <span>輸出品質</span>
                <select data-crop-quality>
                  ${Object.entries(QUALITY_MODES).map(([value, item]) => `<option value="${value}" ${value === "high" ? "selected" : ""}>${item.label}</option>`).join("")}
                </select>
              </label>
              <div class="crop-output-info" data-crop-info></div>
              <button class="image-upload-button" type="button" data-crop-reset>重設位置</button>
            </div>
          </div>
          <footer class="crop-editor-footer">
            <button class="image-upload-button" type="button" data-crop-cancel>取消</button>
            <button class="image-upload-button primary" type="button" data-crop-confirm>套用剪裁</button>
          </footer>
        </div>`;

      document.body.append(modal);
      document.body.classList.add("crop-editor-open");

      const canvas = modal.querySelector(".crop-editor-canvas");
      const aspectSelect = modal.querySelector("[data-crop-aspect]");
      const zoomInput = modal.querySelector("[data-crop-zoom]");
      const zoomOutput = modal.querySelector("[data-crop-zoom-output]");
      const qualitySelect = modal.querySelector("[data-crop-quality]");
      const info = modal.querySelector("[data-crop-info]");
      const confirmButton = modal.querySelector("[data-crop-confirm]");
      const cancelButton = modal.querySelector("[data-crop-cancel]");
      const closeButton = modal.querySelector("[data-crop-close]");
      const resetButton = modal.querySelector("[data-crop-reset]");

      const state = {
        aspect: aspectSelect.value,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        pointerId: null,
        lastX: 0,
        lastY: 0
      };

      function configurePreviewCanvas() {
        const ratio = aspectRatioFor(state.aspect, decoded);
        if (ratio >= 1) {
          canvas.width = PREVIEW_LONG_EDGE;
          canvas.height = Math.max(1, Math.round(PREVIEW_LONG_EDGE / ratio));
        } else {
          canvas.height = PREVIEW_LONG_EDGE;
          canvas.width = Math.max(1, Math.round(PREVIEW_LONG_EDGE * ratio));
        }
        state.offsetX = 0;
        state.offsetY = 0;
        state.zoom = 1;
        zoomInput.value = "1";
        zoomOutput.textContent = "100%";
        drawPreview();
      }

      function cropMetrics() {
        const baseScale = Math.max(canvas.width / decoded.width, canvas.height / decoded.height);
        const scale = baseScale * state.zoom;
        const drawWidth = decoded.width * scale;
        const drawHeight = decoded.height * scale;
        const maxOffsetX = Math.max(0, (drawWidth - canvas.width) / 2);
        const maxOffsetY = Math.max(0, (drawHeight - canvas.height) / 2);

        state.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, state.offsetX));
        state.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, state.offsetY));

        return {
          scale,
          drawWidth,
          drawHeight,
          drawX: (canvas.width - drawWidth) / 2 + state.offsetX,
          drawY: (canvas.height - drawHeight) / 2 + state.offsetY
        };
      }

      function outputDimensions() {
        const metrics = cropMetrics();
        const sourceWidth = canvas.width / metrics.scale;
        const sourceHeight = canvas.height / metrics.scale;
        const resizeScale = Math.min(1, rule.outputLongEdge / Math.max(sourceWidth, sourceHeight));
        return {
          sourceWidth,
          sourceHeight,
          width: Math.max(1, Math.round(sourceWidth * resizeScale)),
          height: Math.max(1, Math.round(sourceHeight * resizeScale))
        };
      }

      function drawPreview() {
        const context = get2dContext(canvas);
        const metrics = cropMetrics();

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#101216";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(decoded.source, metrics.drawX, metrics.drawY, metrics.drawWidth, metrics.drawHeight);

        context.save();
        context.strokeStyle = "rgba(255,255,255,.46)";
        context.lineWidth = Math.max(1, canvas.width / 700);
        context.setLineDash([canvas.width / 70, canvas.width / 110]);
        for (let index = 1; index < 3; index += 1) {
          const x = (canvas.width / 3) * index;
          const y = (canvas.height / 3) * index;
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, canvas.height);
          context.stroke();
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(canvas.width, y);
          context.stroke();
        }
        context.restore();

        const output = outputDimensions();
        const mode = QUALITY_MODES[qualitySelect.value] || QUALITY_MODES.high;
        info.innerHTML = `<strong>輸出約 ${output.width} × ${output.height}px</strong><span>${mode.label}；不再壓到原本的低畫質大小。</span>`;
      }

      function pointOnCanvas(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * (canvas.width / rect.width),
          y: (event.clientY - rect.top) * (canvas.height / rect.height)
        };
      }

      function finish(result) {
        if (settled) return;
        settled = true;
        decoded?.cleanup?.();
        modal.remove();
        document.body.classList.remove("crop-editor-open");
        document.removeEventListener("keydown", onKeyDown);
        resolve(result);
      }

      function onKeyDown(event) {
        if (event.key === "Escape") finish(null);
      }

      canvas.addEventListener("pointerdown", (event) => {
        if (state.dragging) return;
        const point = pointOnCanvas(event);
        state.dragging = true;
        state.pointerId = event.pointerId;
        state.lastX = point.x;
        state.lastY = point.y;
        canvas.setPointerCapture?.(event.pointerId);
        canvas.classList.add("is-dragging");
      });

      canvas.addEventListener("pointermove", (event) => {
        if (!state.dragging || event.pointerId !== state.pointerId) return;
        const point = pointOnCanvas(event);
        state.offsetX += point.x - state.lastX;
        state.offsetY += point.y - state.lastY;
        state.lastX = point.x;
        state.lastY = point.y;
        drawPreview();
      });

      function stopDragging(event) {
        if (!state.dragging || event.pointerId !== state.pointerId) return;
        state.dragging = false;
        canvas.releasePointerCapture?.(event.pointerId);
        state.pointerId = null;
        canvas.classList.remove("is-dragging");
      }

      canvas.addEventListener("pointerup", stopDragging);
      canvas.addEventListener("pointercancel", stopDragging);

      aspectSelect.addEventListener("change", () => {
        state.aspect = aspectSelect.value;
        configurePreviewCanvas();
      });

      zoomInput.addEventListener("input", () => {
        const previousZoom = state.zoom;
        state.zoom = Number(zoomInput.value) || 1;
        if (previousZoom > 0) {
          state.offsetX *= state.zoom / previousZoom;
          state.offsetY *= state.zoom / previousZoom;
        }
        zoomOutput.textContent = `${Math.round(state.zoom * 100)}%`;
        drawPreview();
      });

      qualitySelect.addEventListener("change", drawPreview);
      resetButton.addEventListener("click", configurePreviewCanvas);
      cancelButton.addEventListener("click", () => finish(null));
      closeButton.addEventListener("click", () => finish(null));
      modal.addEventListener("click", (event) => {
        if (event.target === modal) finish(null);
      });
      document.addEventListener("keydown", onKeyDown);

      confirmButton.addEventListener("click", async () => {
        const originalText = confirmButton.textContent;
        confirmButton.disabled = true;
        cancelButton.disabled = true;
        closeButton.disabled = true;
        confirmButton.textContent = "正在輸出高清圖片…";

        try {
          const metrics = cropMetrics();
          const dimensions = outputDimensions();
          const sourceX = Math.max(0, -metrics.drawX / metrics.scale);
          const sourceY = Math.max(0, -metrics.drawY / metrics.scale);
          const sourceWidth = Math.min(decoded.width - sourceX, dimensions.sourceWidth);
          const sourceHeight = Math.min(decoded.height - sourceY, dimensions.sourceHeight);

          const outputCanvas = createCanvas(dimensions.width, dimensions.height);
          const outputContext = get2dContext(outputCanvas);
          outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
          outputContext.drawImage(
            decoded.source,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            outputCanvas.width,
            outputCanvas.height
          );

          const blob = await encodeHighQuality(outputCanvas, file, qualitySelect.value, rule.softLimitBytes);
          finish({
            dataUrl: await blobToDataUrl(blob),
            bytes: blob.size,
            width: outputCanvas.width,
            height: outputCanvas.height,
            type: blob.type,
            aspect: state.aspect,
            qualityMode: qualitySelect.value
          });
        } catch (error) {
          notify(errorMessage(error), "warning");
          confirmButton.disabled = false;
          cancelButton.disabled = false;
          closeButton.disabled = false;
          confirmButton.textContent = originalText;
        }
      });

      configurePreviewCanvas();
      window.setTimeout(() => confirmButton.focus(), 0);
    });
  }

  async function applyImageFile(file, pathInput, uploader, key) {
    const chooseButton = uploader.querySelector("[data-image-choose]");
    const status = uploader.querySelector(".image-upload-status");
    const originalText = chooseButton?.textContent || "選擇圖片";

    uploader.dataset.processing = "true";
    if (chooseButton) {
      chooseButton.disabled = true;
      chooseButton.textContent = "開啟剪裁…";
    }
    if (status) status.textContent = "正在讀取原圖。";

    try {
      const result = await openCropEditor(file, key);
      if (!result) {
        if (status) status.textContent = "已取消圖片剪裁。";
        return;
      }

      pathInput.value = result.dataUrl;
      pathInput.dispatchEvent(new Event("input", { bubbles: true }));
      refreshUploader(uploader, pathInput, key);

      const animationNote = file.type === "image/gif" ? "；GIF 使用第一幀" : "";
      notify(`圖片已剪裁並以高清品質儲存：${formatBytes(result.bytes)}（${result.width}×${result.height}）${animationNote}。`, "success");
    } catch (error) {
      notify(errorMessage(error), "warning");
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
    const cropButton = uploader.querySelector("[data-image-recrop]");
    const chooseButton = uploader.querySelector("[data-image-choose]");

    previewSlot?.replaceChildren(createPreview(value, label));
    if (status) {
      status.textContent = value
        ? (isEmbeddedImage(value)
          ? "已使用高清內嵌圖片；可重新剪裁、更換或移除。"
          : "目前使用既有圖片路徑。")
        : "從相簿或檔案選擇後，會先開啟剪裁畫面，再以高清品質儲存。";
    }
    if (removeButton) removeButton.hidden = !value;
    if (cropButton) cropButton.hidden = !isEmbeddedImage(value);
    if (chooseButton) chooseButton.textContent = value ? "更換原圖" : "選擇圖片";
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
    chooseButton.textContent = pathInput.value.trim() ? "更換原圖" : "選擇圖片";

    const cropButton = document.createElement("button");
    cropButton.type = "button";
    cropButton.className = "image-upload-button";
    cropButton.dataset.imageRecrop = "";
    cropButton.textContent = "重新剪裁";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "image-upload-button danger";
    removeButton.dataset.imageRemove = "";
    removeButton.textContent = "移除圖片";

    const status = document.createElement("p");
    status.className = "image-upload-status";

    controls.append(fileInput, chooseButton, cropButton, removeButton, status);
    uploader.append(previewSlot, controls);

    const details = document.createElement("details");
    details.className = "image-path-fallback";
    const summary = document.createElement("summary");
    summary.textContent = "進階：改用圖片路徑或網址";
    const pathHelp = document.createElement("small");
    pathHelp.textContent = "一般不需要填寫。直接選圖後會先剪裁，再轉成可發布的高清內嵌資料。";
    pathInput.setAttribute("aria-label", `${label}路徑`);
    details.append(summary, pathInput, pathHelp);

    oldField.replaceWith(field);
    field.append(uploader, details);

    chooseButton.addEventListener("click", () => fileInput.click());
    cropButton.addEventListener("click", async () => {
      if (!isEmbeddedImage(pathInput.value)) return;
      try {
        const blob = dataUrlToBlob(pathInput.value);
        const extension = blob.type.split("/")[1] || "webp";
        const file = new File([blob], `current-image.${extension}`, { type: blob.type });
        await applyImageFile(file, pathInput, uploader, key);
      } catch {
        notify("目前圖片無法重新剪裁，請選擇原圖重新上傳。", "warning");
      }
    });
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

  const observer = new MutationObserver(installUploaders);
  observer.observe(formRoot, { childList: true, subtree: true });
  installUploaders();
})();
