/* ============================================================
   downloads.js — powers downloads.html: wires up each download
   button to fetch + save the corresponding data file.
   ============================================================ */

document.querySelectorAll(".download-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const file = btn.dataset.file;
    const name = btn.dataset.name;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "…";
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      APP.toast(`${name} ${APP.t("downloaded_toast")}`);
      APP.announce(`${name} ${APP.t("downloaded_toast")}`);
    } catch (e) {
      APP.toast(APP.t("download_failed_toast"));
      APP.announce(APP.t("download_failed_toast"));
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  });
});
