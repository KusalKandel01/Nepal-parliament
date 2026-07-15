/* ============================================================
   app.js — shared utilities: theme, nav, data loading, helpers
   Loaded on every page. No frameworks, no build step.
   ============================================================ */

const APP = (() => {
  const DATA_BASE = "/assets/data/";
  // Bump this whenever assets/data/*.json changes so returning visitors get
  // fresh data immediately instead of waiting out the Cache-Control max-age.
  const DATA_VERSION = "2083-v1.3";
  const cache = {};

  async function loadJSON(name) {
    if (cache[name]) return cache[name];
    const res = await fetch(`${DATA_BASE}${name}?v=${DATA_VERSION}`, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Failed to load ${name}: ${res.status}`);
    const json = await res.json();
    cache[name] = json;
    return json;
  }

  function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    const safe = escapeHtml(text);
    const q = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      return safe.replace(new RegExp(`(${q})`, "ig"), "<mark>$1</mark>");
    } catch (e) {
      return safe;
    }
  }

  const PARTY_COLOR_VARS = {
    RSP: "--party-rsp", NC: "--party-nc", UML: "--party-uml", MLM: "--party-mlm",
    RPP: "--party-rpp", SP: "--party-sp", JSP: "--party-jsp", LSP: "--party-lsp",
    IND: "--party-ind", NOM: "--party-nom", OTH: "--party-oth"
  };
  function partyColorVar(code) {
    return `var(${PARTY_COLOR_VARS[code] || "--party-oth"})`;
  }
  // Resolve a CSS var() string to its computed color value (needed inside <svg> fill
  // attributes and canvas-like contexts where var() isn't reliably inherited).
  function resolvePartyColor(code) {
    const varName = PARTY_COLOR_VARS[code] || "--party-oth";
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  const PARTY_LABEL_SHORT = {
    RSP: "RSP", NC: "NC", UML: "UML", MLM: "MLM", RPP: "RPP",
    SP: "SP", JSP: "JSP", LSP: "LSP", IND: "IND", NOM: "मनोनीत", OTH: "अन्य"
  };
  // Nepali party names in members.json have no English field, so this
  // provides a plain-English rendering when the site is toggled to EN.
  // These are direct translations of the source Nepali labels, not a
  // separate authoritative registry.
  const PARTY_LABEL_EN = {
    RSP: "Rastriya Swatantra Party",
    NC: "Nepali Congress",
    UML: "Nepal Communist Party (UML)",
    MLM: "Nepali Communist Party",
    RPP: "Rastriya Prajatantra Party",
    SP: "Shram Sanskriti Party",
    JSP: "Janata Samajbadi Party",
    LSP: "Loktantrik Samajwadi Party",
    IND: "Independent",
    NOM: "Nominated",
    OTH: "Other",
  };
  function partyLabelFor(code, nepaliFallback) {
    if (getLang() === "en") return PARTY_LABEL_EN[code] || nepaliFallback || code;
    return nepaliFallback || code;
  }

  /* ---------------- Theme ---------------- */
  function initTheme() {
    const saved = localStorage.getItem("npd-theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
    updateThemeIcon();
  }
  function toggleTheme() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("npd-theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("npd-theme", "dark");
    }
    updateThemeIcon();
  }
  function updateThemeIcon() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }

  /* ---------------- Inline icon strings (avoids extra fetches for header) ---------------- */
  const ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    chevronUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="18 15 12 9 6 15"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.83.494 3.626 1.432 5.2L2 22l4.933-1.408A9.945 9.945 0 0 0 12.001 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.2c-1.65 0-3.263-.444-4.666-1.286l-.334-.198-2.929.836.85-2.858-.217-.34A8.19 8.19 0 0 1 3.8 12c0-4.526 3.674-8.2 8.2-8.2s8.2 3.674 8.2 8.2-3.674 8.2-8.2 8.2z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>'
  };

  /* ---------------- Header / Footer injection ---------------- */
  function renderHeader(activePage) {
    const mount = document.getElementById("siteHeader");
    if (!mount) return;
    const links = [
      ["index.html", t("nav_home")],
      ["directory.html", t("nav_directory")],
      ["houses.html", t("nav_houses")],
      ["leadership.html", t("nav_leadership")],
      ["committees.html", t("nav_committees")],
      ["statistics.html", t("nav_statistics")],
      ["downloads.html", t("nav_downloads")],
      ["about.html", t("nav_about")],
    ];
    const navHtml = links.map(([href, label]) => {
      const isActive = activePage === href;
      return `<a class="nav-link${isActive ? " active" : ""}" href="${href}"${isActive ? ' aria-current="page"' : ""}>${label}</a>`;
    }).join("");

    mount.innerHTML = `
      <div class="container">
        <a class="brand" href="index.html">
          <span class="brand-crest" aria-hidden="true">सं</span>
          <span class="brand-title">${getLang() === "en" ? "Federal Parliament Contact Directory" : "संघीय संसद सम्पर्क निर्देशिका"}
            <span class="sub">${getLang() === "en" ? "संघीय संसद सम्पर्क निर्देशिका" : "Federal Parliament Contact Directory"}</span>
          </span>
        </a>
        <nav class="header-nav" aria-label="Primary">${navHtml}</nav>
        <div class="header-actions">
          <div id="langToggleMount" class="header-lang-mount"></div>
          <button class="icon-btn" id="themeToggle" aria-label="Toggle dark mode"></button>
          <button class="icon-btn" id="printBtn" aria-label="Print this page">${ICONS.printer}</button>
          <button class="icon-btn hamburger" id="menuBtn" aria-label="Open menu" aria-expanded="false">${ICONS.menu}</button>
        </div>
      </div>
      <div class="mobile-drawer" id="mobileDrawer">
        <div class="scrim" data-close></div>
        <div class="panel-slide">
          <button class="icon-btn close-drawer" id="closeDrawer" aria-label="Close menu">${ICONS.x}</button>
          ${links.map(([href, label]) => `<a class="nav-link${activePage === href ? " active" : ""}" href="${href}">${label}</a>`).join("")}
        </div>
      </div>
    `;

    document.getElementById("printBtn").addEventListener("click", () => window.print());
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
    updateThemeIcon();
    initLangToggle();

    const drawer = document.getElementById("mobileDrawer");
    const menuBtn = document.getElementById("menuBtn");
    const closeDrawer = document.getElementById("closeDrawer");
    let lastFocused = null;

    function getFocusable() {
      return Array.from(drawer.querySelectorAll('a[href], button:not([disabled])'));
    }
    function trapFocus(e) {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    const openDrawer = () => {
      lastFocused = document.activeElement;
      drawer.classList.add("open");
      menuBtn.setAttribute("aria-expanded", "true");
      closeDrawer.focus();
      drawer.addEventListener("keydown", trapFocus);
    };
    const shutDrawer = () => {
      drawer.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      drawer.removeEventListener("keydown", trapFocus);
      if (lastFocused) lastFocused.focus();
    };
    menuBtn.addEventListener("click", openDrawer);
    closeDrawer.addEventListener("click", shutDrawer);
    drawer.querySelector(".scrim").addEventListener("click", shutDrawer);
    drawer.querySelectorAll(".nav-link").forEach(a => a.addEventListener("click", shutDrawer));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("open")) shutDrawer(); });
  }

  /* ---------------- Screen-reader live announcer (separate from visual toast) ---------------- */
  function announce(message) {
    let region = document.getElementById("srAnnouncer");
    if (!region) {
      region = document.createElement("div");
      region.id = "srAnnouncer";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("role", "status");
      region.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
      document.body.appendChild(region);
    }
    region.textContent = "";
    // re-trigger even for identical consecutive messages
    requestAnimationFrame(() => { region.textContent = message; });
  }

  /* ---------------- Mark English text for correct screen-reader pronunciation ---------------- */
  function enSpan(text) {
    return text ? `<span lang="en">${escapeHtml(text)}</span>` : "";
  }

  /* ---------------- Breadcrumb / back-bar for interior pages ---------------- */
  function renderSubnav(currentLabelKey, backHref = "directory.html", backLabelKey = "nav_directory") {
    const mount = document.getElementById("subnav");
    if (!mount) return;
    mount.innerHTML = `
      <div class="container subnav-inner">
        <a class="subnav-back" href="${backHref}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          ${t("back")}
        </a>
        <nav class="subnav-crumbs" aria-label="Breadcrumb">
          <a href="index.html">${t("nav_home")}</a>
          <span class="sep" aria-hidden="true">/</span>
          ${backHref !== "index.html" ? `<a href="${backHref}">${t(backLabelKey)}</a><span class="sep" aria-hidden="true">/</span>` : ""}
          <span class="current" aria-current="page">${t(currentLabelKey)}</span>
        </nav>
      </div>`;
  }

  function renderFooter() {
    const mount = document.getElementById("siteFooter");
    if (!mount) return;
    const year = new Date().getFullYear();
    mount.innerHTML = `
      <div class="container">
        <div>© ${year} ${t("footer_rights")}</div>
        <div class="footer-links">
          <a href="about.html">${t("nav_about")}</a>
          <a href="downloads.html">${t("nav_downloads")}</a>
          <a href="https://www.parliament.gov.np" target="_blank" rel="noopener">parliament.gov.np</a>
        </div>
      </div>
    `;
  }

  function initScrollTop() {
    const btn = document.getElementById("scrollTopBtn");
    if (!btn) return;
    btn.innerHTML = ICONS.chevronUp;
    window.addEventListener("scroll", () => {
      btn.classList.toggle("visible", window.scrollY > 480);
    }, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------------- Keyboard shortcuts ---------------- */
  function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.getElementById("searchInput");
        if (input) { input.focus(); input.select(); }
        else { window.location.href = "directory.html#focus-search"; }
      }
      if (!typing && e.key === "/") {
        const input = document.getElementById("searchInput");
        if (input) { e.preventDefault(); input.focus(); }
      }
    });
  }

  /* ---------------- Toast ---------------- */
  function toast(message) {
    let el = document.getElementById("appToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "appToast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--navy);color:#fff;padding:10px 20px;border-radius:100px;font-size:0.85rem;box-shadow:0 8px 24px rgba(0,0,0,0.25);z-index:999;opacity:0;transition:opacity .25s, transform .25s;";
      document.body.appendChild(el);
    }
    el.textContent = message;
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(-50%) translateY(0)";
    });
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(20px)";
    }, 1800);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied`);
      return true;
    } catch (e) {
      toast("Copy failed — please copy manually");
      return false;
    }
  }

  function whatsappLink(phone) {
    const digits = String(phone).replace(/\D/g, "");
    const intl = digits.length === 10 ? "977" + digits : digits;
    return `https://wa.me/${intl}`;
  }

  function vCard(member) {
    const phone = member.phones && member.phones[0] ? member.phones[0] : "";
    const email = member.emails && member.emails[0] ? member.emails[0] : "";
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN;CHARSET=UTF-8:${member.name_en || member.name_ne}`,
      `N;CHARSET=UTF-8:${member.name_en || member.name_ne};;;;`,
      member.name_ne ? `NICKNAME;CHARSET=UTF-8:${member.name_ne}` : "",
      phone ? `TEL;TYPE=CELL:+977${phone}` : "",
      email ? `EMAIL:${email}` : "",
      member.district ? `ADR;TYPE=WORK:;;${member.district};;;;Nepal` : "",
      member.party_ne ? `ORG;CHARSET=UTF-8:${member.party_ne}` : "",
      member.role ? `TITLE:${member.role}` : "",
      "END:VCARD"
    ].filter(Boolean).join("\r\n");
  }

  function downloadFile(filename, content, mime = "text/plain") {
    const blob = new Blob([content], { type: mime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function initReveal() {
    // no-op placeholder for future scroll-reveal; respects reduced motion by default via CSS
  }

  /* ---------------- Photo fallback (CSP-safe, replaces inline onerror=) ----------------
     Member photo <img> tags carry data-fallback-initial instead of an inline onerror
     handler, since the site's Content-Security-Policy (script-src 'self', no
     'unsafe-inline') blocks inline event handler attributes outright. The "error"
     event doesn't bubble, so this listener is attached in the capture phase on
     document, which does see it — one delegated listener covers every photo on
     every page, including ones injected later via innerHTML (directory cards,
     member profile, etc.). */
  function initPhotoFallback() {
    document.addEventListener("error", (e) => {
      const img = e.target;
      if (img && img.tagName === "IMG" && img.dataset && img.dataset.fallbackInitial !== undefined) {
        img.parentElement.innerHTML = `<span translate="no">${img.dataset.fallbackInitial}</span>`;
      }
    }, true);
  }

  /* ---------------- Service worker registration (offline support) ---------------- */
  function initServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // Offline support is a progressive enhancement; failure here is non-fatal.
        });
      });
    }
  }

  /* ---------------- Sticky filter bar shadow-on-scroll ---------------- */
  function initStickyFilterBar() {
    const bar = document.getElementById("filterBar");
    if (!bar || !("IntersectionObserver" in window)) return;
    const sentinel = document.createElement("div");
    bar.parentNode.insertBefore(sentinel, bar);
    const io = new IntersectionObserver(
      ([entry]) => bar.classList.toggle("is-stuck", !entry.isIntersecting),
      { threshold: 1, rootMargin: `-${document.getElementById("siteHeader")?.offsetHeight || 64}px 0px 0px 0px` }
    );
    io.observe(sentinel);
  }

  /* ---------------- Language (ने/EN) — real first-party bilingual UI ---------------- */
  function getLang() { return window.I18N_ENGINE ? window.I18N_ENGINE.getLang() : "ne"; }
  function t(key) { return window.I18N_ENGINE ? window.I18N_ENGINE.t(key) : key; }

  function initLangToggle() {
    const mount = document.getElementById("langToggleMount");
    if (!mount || !window.I18N_ENGINE) return;
    const lang = getLang();
    mount.innerHTML = `
      <div class="lang-toggle" role="group" aria-label="${t("lang_toggle_label")}">
        <button type="button" data-lang="ne" class="${lang === "ne" ? "active" : ""}" aria-pressed="${lang === "ne"}">ने</button>
        <button type="button" data-lang="en" class="${lang === "en" ? "active" : ""}" aria-pressed="${lang === "en"}">EN</button>
      </div>`;
    mount.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.lang === lang) return;
        window.I18N_ENGINE.setLang(btn.dataset.lang);
        window.location.reload();
      });
    });
  }

  /* ---------------- Skeleton loading cards ---------------- */
  function skeletonCards(count = 8) {
    return Array.from({ length: count }, () => `<div class="skeleton-card" aria-hidden="true"></div>`).join("");
  }

  return {
    loadJSON, debounce, escapeHtml, highlight, partyColorVar, resolvePartyColor, PARTY_LABEL_SHORT,
    initTheme, toggleTheme, renderHeader, renderSubnav, renderFooter, initScrollTop,
    initKeyboardShortcuts, toast, announce, enSpan, copyText, whatsappLink, vCard, downloadFile,
    initServiceWorker, initStickyFilterBar, initLangToggle, skeletonCards, ICONS, t, getLang,
    initPhotoFallback, partyLabelFor, PARTY_LABEL_EN
  };
})();

// Apply saved theme before paint to avoid flash
APP.initTheme();
APP.initServiceWorker();
APP.initPhotoFallback();
// Sync <html lang> to the stored language preference immediately (avoids a
// flash of the wrong lang attribute, which matters for screen readers).
if (window.I18N_ENGINE) {
  document.documentElement.setAttribute("lang", APP.getLang() === "en" ? "en" : "ne");
  document.addEventListener("DOMContentLoaded", () => window.I18N_ENGINE.applyStatic());
}
