/* ============================================================
   home.js, homepage-only glue. app.js (loaded just before this)
   already applies data-i18n text and sets <html lang> automatically
   on DOMContentLoaded. This file only wires the compact ने/EN
   toggle in the chamber header, since the homepage uses its own
   lightweight header markup rather than APP.renderHeader().
   ============================================================ */

(function () {
  function initHomeLangToggle() {
    const mount = document.getElementById("homeLangToggle");
    if (!mount || !window.I18N_ENGINE) return;
    const lang = window.I18N_ENGINE.getLang();
    mount.querySelectorAll("a").forEach(link => {
      link.classList.toggle("active", link.dataset.lang === lang);
      link.setAttribute("aria-current", link.dataset.lang === lang ? "page" : "false");
      link.addEventListener("click", () => window.I18N_ENGINE.setLang(link.dataset.lang));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHomeLangToggle);
  } else {
    initHomeLangToggle();
  }
})();
