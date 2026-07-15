/* ============================================================
   page-boot.js — shared header/subnav/footer bootstrap for pages
   that have no dedicated page-specific JS file (about, 404, offline).
   Reads config from data-* attributes on <body> instead of an inline
   <script>, since the site's CSP is script-src 'self' with no
   'unsafe-inline' — inline <script> blocks are silently dropped by
   the browser.
   ============================================================ */

(function () {
  const b = document.body;
  APP.renderHeader(b.dataset.page || "");
  if (b.dataset.subnavKey) {
    APP.renderSubnav(b.dataset.subnavKey, b.dataset.backHref || "index.html", b.dataset.backKey || "nav_home");
  }
  APP.renderFooter();
  if (b.dataset.scrollTop !== undefined) APP.initScrollTop();

  // Replaces onclick="location.reload()" (also blocked as an inline event
  // handler under this CSP).
  const reloadBtn = document.getElementById("reloadBtn");
  if (reloadBtn) reloadBtn.addEventListener("click", () => location.reload());
})();
