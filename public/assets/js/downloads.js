/* ============================================================
   downloads.js, powers downloads.html: wires up each download
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

/* ---- Page bootstrap (was an inline <script> in downloads.html; moved here
   because the site's CSP is script-src 'self' with no 'unsafe-inline') ---- */
APP.renderHeader("downloads.html");
APP.renderSubnav("nav_downloads", "index.html", "nav_home");
APP.renderFooter();
APP.initScrollTop();
APP.loadJSON("metadata.json").then(meta => {
  document.getElementById("lastUpdated").textContent = meta.generated_at || "N/A";
  document.getElementById("dataVersion").textContent = meta.data_version || "2083-v1";
}).catch(() => {});
