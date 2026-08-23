(() => {
  "use strict";

  const headerActions = document.querySelector(".header-actions");
  if (!headerActions) return;

  const controls = document.createElement("div");
  controls.className = "public-controls";
  controls.setAttribute("aria-label", "公開瀏覽工具");
  controls.innerHTML = `
    <span class="readonly-badge" title="公開內容只能瀏覽；編輯器中的修改會先保存為本機草稿">
      <span class="readonly-dot" aria-hidden="true"></span>
      公開頁面・唯讀
    </span>
    <button class="public-action-button" id="share-page-button" type="button">分享此頁</button>
    <button class="public-action-button" id="force-update-button" type="button">強制更新</button>
  `;
  headerActions.prepend(controls);

  const toast = document.createElement("div");
  toast.className = "public-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.append(toast);

  const editButton = document.getElementById("edit-content-button");
  const shareButton = document.getElementById("share-page-button");
  const updateButton = document.getElementById("force-update-button");
  let toastTimer = 0;

  function showToast(message, kind = "normal") {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.kind = kind;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function cleanPublicUrl() {
    const url = new URL(window.location.href);
    ["refresh", "update", "cache", "v", "_", "owner"].forEach((key) => url.searchParams.delete(key));
    return url;
  }

  editButton?.addEventListener("click", () => {
    try { localStorage.setItem("about-my-oc-owner-mode", "1"); } catch { /* ignore */ }
  });

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

  shareButton?.addEventListener("click", async () => {
    if (window.location.protocol === "file:") {
      showToast("離線檔案不能產生公開連結，請分享 GitHub Pages 網址。", "warning");
      return;
    }

    const url = cleanPublicUrl().toString();
    const siteTitle = window.OC_SITE_DATA?.site?.title || "我的 OC 檔案館";
    const shareData = {
      title: document.title || siteTitle,
      text: `來看看「${siteTitle}」的角色介紹。`,
      url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showToast("已開啟分享選單。", "success");
        return;
      }

      await copyText(url);
      showToast("連結已複製。", "success");
    } catch (error) {
      if (error?.name === "AbortError") return;
      try {
        await copyText(url);
        showToast("連結已複製。", "success");
      } catch {
        window.prompt("請複製這個公開連結：", url);
      }
    }
  });

  updateButton?.addEventListener("click", () => {
    const originalLabel = updateButton.textContent;
    updateButton.disabled = true;
    updateButton.textContent = "更新中…";

    if (window.location.protocol === "file:") {
      showToast("正在重新讀取本機檔案。", "success");
      window.setTimeout(() => window.location.reload(), 120);
      return;
    }

    try {
      const url = cleanPublicUrl();
      url.searchParams.set("refresh", Date.now().toString());
      window.location.replace(url.toString());
    } catch {
      updateButton.disabled = false;
      updateButton.textContent = originalLabel;
      showToast("更新失敗，請重新整理頁面。", "warning");
    }
  });

  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.has("refresh")) {
    const cleanUrl = cleanPublicUrl();
    window.history.replaceState(null, "", cleanUrl.toString());
    window.setTimeout(() => showToast("已強制載入最新內容。", "success"), 180);
  }
})();
