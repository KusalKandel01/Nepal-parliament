/* ============================================================
   filters.js, powers directory.html: search, filters, sort,
   pagination, URL state, card rendering, quick actions.
   Fully bilingual: all UI chrome goes through APP.t(); member
   data (names/district/party) is real content, not UI chrome,
   so it always shows both scripts regardless of UI language.
   ============================================================ */

(async function () {
  const grid = document.getElementById("memberGrid");
  if (!grid) return;

  const lang = APP.getLang();
  const searchInput = document.getElementById("searchInput");
  const partySelect = document.getElementById("partyFilter");
  const houseToggle = document.getElementById("houseToggle");
  const alphaRow = document.getElementById("alphaRow");
  const sortSelect = document.getElementById("sortSelect");
  const resultsInfo = document.getElementById("resultsInfo");
  const pagination = document.getElementById("pagination");
  const statsBar = document.getElementById("statsBar");

  const PAGE_SIZE = 24;
  let state = { q: "", party: "all", house: "all", alpha: "", sort: "name-asc", page: 1 };

  grid.innerHTML = APP.skeletonCards(12);

  let data;
  try {
    data = await APP.loadJSON("members.json");
  } catch (e) {
    grid.innerHTML = `<div class="no-results"><p>${APP.t("no_results_title")}</p><span>Failed to load member data. Please reload the page.</span></div>`;
    return;
  }
  const members = data.members;
  const partyLabels = data.metadata.party_codes;

  // ---- restore state from URL ----
  const params = new URLSearchParams(window.location.search);
  if (params.get("q")) state.q = params.get("q");
  if (params.get("party")) state.party = params.get("party");
  if (params.get("house")) state.house = params.get("house");
  if (params.get("alpha")) state.alpha = params.get("alpha");
  if (params.get("sort")) state.sort = params.get("sort");
  if (params.get("page")) state.page = parseInt(params.get("page")) || 1;
  if (searchInput) searchInput.value = state.q;

  function pushState() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.party !== "all") p.set("party", state.party);
    if (state.house !== "all") p.set("house", state.house);
    if (state.alpha) p.set("alpha", state.alpha);
    if (state.sort !== "name-asc") p.set("sort", state.sort);
    if (state.page > 1) p.set("page", state.page);
    const qs = p.toString();
    const url = window.location.pathname + (qs ? "?" + qs : "");
    window.history.replaceState({}, "", url);
  }

  // ---- build party filter options ----
  function partyCounts(list) {
    const c = {};
    list.forEach(m => { c[m.party_code] = (c[m.party_code] || 0) + 1; });
    return c;
  }
  function buildPartyOptions() {
    const counts = partyCounts(members);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    let html = `<option value="all">${APP.t("all_parties")} (${members.length})</option>`;
    sorted.forEach(([code, n]) => {
      html += `<option value="${code}">${APP.escapeHtml(APP.partyLabelFor(code, partyLabels[code]))} (${n})</option>`;
    });
    if (partySelect) partySelect.innerHTML = html;
  }
  buildPartyOptions();
  if (partySelect) partySelect.value = state.party;

  // ---- alphabet row: Devanagari अ-ह in Nepali mode, A-Z in English mode,
  // since filtering by first letter should match whichever name script is
  // actually shown as the primary name on the card ----
  const DEV_ALPHA = ["अ","आ","इ","ई","उ","ऊ","ए","ऐ","ओ","औ","क","ख","ग","घ","च","छ","ज","झ","ट","ठ","ड","ढ","त","थ","द","ध","न","प","फ","ब","भ","म","य","र","ल","व","श","ष","स","ह"];
  const EN_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const ALPHA_SET = lang === "en" ? EN_ALPHA : DEV_ALPHA;

  // discard a stale alpha value carried over from a URL/state that belongs
  // to the other script (e.g. a Devanagari letter surviving a switch to EN)
  if (state.alpha && !ALPHA_SET.includes(state.alpha)) state.alpha = "";

  function buildAlphaRow() {
    if (!alphaRow) return;
    let html = `<button class="alpha-btn${state.alpha === "" ? " active" : ""}" data-alpha="" title="${APP.t("all")}" aria-pressed="${state.alpha === ""}">${APP.t("all_short")}</button>`;
    ALPHA_SET.forEach(ch => {
      html += `<button class="alpha-btn${state.alpha === ch ? " active" : ""}" data-alpha="${ch}" aria-pressed="${state.alpha === ch}" translate="no">${ch}</button>`;
    });
    alphaRow.innerHTML = html;
    alphaRow.querySelectorAll(".alpha-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.alpha = btn.dataset.alpha;
        state.page = 1;
        alphaRow.querySelectorAll(".alpha-btn").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        render();
      });
    });
  }
  buildAlphaRow();

  // ---- house toggle ----
  function buildHouseToggle() {
    if (!houseToggle) return;
    const hor = members.filter(m => m.house === "HoR").length;
    const na = members.filter(m => m.house === "NA").length;
    houseToggle.innerHTML = `
      <button data-house="all" class="${state.house === "all" ? "active" : ""}">${APP.t("house_all")} (${members.length})</button>
      <button data-house="HoR" class="${state.house === "HoR" ? "active" : ""}">${APP.t("house_hor")} (${hor})</button>
      <button data-house="NA" class="${state.house === "NA" ? "active" : ""}">${APP.t("house_na")} (${na})</button>
    `;
    houseToggle.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        state.house = btn.dataset.house;
        state.page = 1;
        houseToggle.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        render();
      });
    });
  }
  buildHouseToggle();

  // ---- sort dropdown labels ----
  if (sortSelect) {
    sortSelect.innerHTML = `
      <option value="name-asc">${APP.t("sort_name_asc")}</option>
      <option value="name-desc">${APP.t("sort_name_desc")}</option>
      <option value="district">${APP.t("sort_district")}</option>
      <option value="party">${APP.t("sort_party")}</option>
      <option value="house">${APP.t("sort_house")}</option>
    `;
  }

  // ---- stats bar ----
  function renderStats(filtered) {
    if (!statsBar) return;
    const parties = new Set(members.map(m => m.party_code)).size;
    statsBar.innerHTML = `
      <div class="stat-item"><div class="num">${members.length}</div><div class="label">${APP.t("stat_total")}</div></div>
      <div class="stat-item"><div class="num">${parties}</div><div class="label">${APP.t("stat_parties")}</div></div>
      <div class="stat-item"><div class="num">${filtered.length}</div><div class="label">${APP.t("stat_found")}</div></div>
    `;
  }

  // ---- filter + search + sort pipeline ----
  function applyFilters() {
    const q = state.q.trim().toLowerCase();
    let list = members.filter(m => {
      if (state.party !== "all" && m.party_code !== state.party) return false;
      if (state.house !== "all" && m.house !== state.house) return false;
      if (state.alpha) {
        const nameField = lang === "en" ? (m.name_en || "").toUpperCase() : (m.name_ne || "");
        if (!nameField.startsWith(state.alpha)) return false;
      }
      if (q) {
        const hay = [m.name_ne, m.name_en, m.district, m.party_ne, ...(m.phones||[]), ...(m.emails||[])]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    switch (state.sort) {
      case "name-asc":
        list.sort((a, b) => lang === "en"
          ? (a.name_en||"").localeCompare(b.name_en||"", "en")
          : (a.name_ne||"").localeCompare(b.name_ne||"", "ne"));
        break;
      case "name-desc":
        list.sort((a, b) => lang === "en"
          ? (b.name_en||"").localeCompare(a.name_en||"", "en")
          : (b.name_ne||"").localeCompare(a.name_ne||"", "ne"));
        break;
      case "district": list.sort((a, b) => (a.district||"").localeCompare(b.district||"", "ne")); break;
      case "party": list.sort((a, b) => (a.party_code||"").localeCompare(b.party_code||"")); break;
      case "house": list.sort((a, b) => a.house.localeCompare(b.house)); break;
    }
    return list;
  }

  function getSavedIds() {
    try { return JSON.parse(localStorage.getItem("npd-saved") || "[]"); }
    catch (e) { return []; }
  }
  function toggleSaved(id) {
    let saved = getSavedIds();
    if (saved.includes(id)) saved = saved.filter(x => x !== id);
    else saved.push(id);
    localStorage.setItem("npd-saved", JSON.stringify(saved));
    return saved.includes(id);
  }

  function cardHTML(m) {
    const savedIds = getSavedIds();
    const isSaved = savedIds.includes(m.id);
    const color = APP.partyColorVar(m.party_code);
    const initial = lang === "en"
      ? (m.name_en || m.name_ne || "?").trim().charAt(0)
      : (m.name_ne || "?").replace(/^मा\.\s*/, "").replace(/^डा\.\s*/, "").trim().charAt(0);
    const avatarInner = m.photo
      ? `<img src="${m.photo}" alt="" width="52" height="52" loading="lazy" data-fallback-initial="${APP.escapeHtml(initial)}">`
      : `<span translate="no">${initial}</span>`;
    const phone = m.phones && m.phones[0];
    const email = m.emails && m.emails[0];

    // In English mode, lead with the English name and show Nepali as the
    // secondary line; in Nepali mode (default), the reverse. Both scripts
    // are always present, this is real bilingual content, not translation.
    const primaryName = lang === "en" ? (m.name_en || m.name_ne) : m.name_ne;

    return `
      <article class="member-card" style="--party-color:${color}" data-id="${m.id}">
        <span class="badge-house">${m.house === "HoR" ? "HoR" : "NA"} · ${m.id.replace("MP","#")}</span>
        <div class="card-top">
          <div class="avatar">${avatarInner}</div>
          <div class="card-body">
            ${m.role ? `<span class="role-pill">${APP.escapeHtml(m.role)}</span>` : ""}
            <h3 class="card-name">${APP.highlight(primaryName, state.q)}</h3>
            <span class="card-party">${APP.escapeHtml(APP.partyLabelFor(m.party_code, m.party_ne) || "N/A")}</span>
          </div>
        </div>
        <div class="card-meta">
          <div class="meta-row">${APP.ICONS.pin}<span>${APP.highlight(APP.districtLabelFor(m.district) || APP.t("district_unspecified"), state.q)}</span></div>
          ${phone
            ? `<div class="meta-row">${APP.ICONS.phone}<a class="link" href="tel:+977${phone}" translate="no">${phone}</a></div>`
            : `<div class="meta-row empty">${APP.t("phone_unavailable")}</div>`}
          ${email
            ? `<div class="meta-row">${APP.ICONS.email}<a class="link" href="mailto:${email}" translate="no">${email}</a></div>`
            : `<div class="meta-row empty">${APP.t("email_unavailable")}</div>`}
        </div>
        <div class="card-actions">
          ${phone ? `<button class="action-btn whatsapp" data-action="whatsapp" data-phone="${phone}">${APP.ICONS.whatsapp}<span class="tooltip">${APP.t("tooltip_whatsapp")}</span></button>` : ""}
          <button class="action-btn copy" data-action="copy" data-phone="${phone||""}" data-email="${email||""}">${APP.ICONS.copy}<span class="tooltip">${APP.t("tooltip_copy")}</span></button>
          <button class="action-btn" data-action="vcard">${APP.ICONS.download}<span class="tooltip">${APP.t("tooltip_vcard")}</span></button>
          <button class="action-btn save${isSaved ? " saved" : ""}" data-action="save"><svg viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span class="tooltip">${isSaved ? APP.t("tooltip_saved") : APP.t("tooltip_save")}</span></button>
          <a class="action-btn" href="member.html?id=${m.id}">${APP.ICONS.info}<span class="tooltip">${APP.t("tooltip_profile")}</span></a>
        </div>
      </article>
    `;
  }

  function attachCardEvents() {
    grid.querySelectorAll(".member-card").forEach(card => {
      const id = card.dataset.id;
      const member = members.find(m => m.id === id);
      card.querySelectorAll("[data-action]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const action = btn.dataset.action;
          if (action === "whatsapp") {
            window.open(APP.whatsappLink(btn.dataset.phone), "_blank");
          } else if (action === "copy") {
            const text = btn.dataset.phone || btn.dataset.email || "";
            APP.copyText(text, text === btn.dataset.phone ? "Phone" : "Email");
            btn.classList.add("copied");
            setTimeout(() => btn.classList.remove("copied"), 1200);
          } else if (action === "vcard") {
            APP.downloadFile(`${(member.name_en||member.id).replace(/\s+/g,"_")}.vcf`, APP.vCard(member), "text/vcard");
          } else if (action === "save") {
            const nowSaved = toggleSaved(id);
            btn.classList.toggle("saved", nowSaved);
            btn.querySelector(".tooltip").textContent = nowSaved ? APP.t("tooltip_saved") : APP.t("tooltip_save");
            APP.toast(nowSaved ? APP.t("tooltip_saved") : APP.t("tooltip_save"));
          }
        });
      });
    });
  }

  function renderPagination(total) {
    if (!pagination) return;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    if (pages <= 1) { pagination.innerHTML = ""; return; }

    let html = `<button class="page-btn" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""} aria-label="${APP.t("page_prev")}">‹</button>`;
    const windowSize = 2;
    for (let p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || Math.abs(p - state.page) <= windowSize) {
        html += `<button class="page-btn${p === state.page ? " active" : ""}" data-page="${p}" ${p === state.page ? 'aria-current="page"' : ""} aria-label="Page ${p}">${p}</button>`;
      } else if (Math.abs(p - state.page) === windowSize + 1) {
        html += `<span class="page-ellipsis">…</span>`;
      }
    }
    html += `<button class="page-btn" data-page="${state.page + 1}" ${state.page === pages ? "disabled" : ""} aria-label="${APP.t("page_next")}">›</button>`;
    pagination.innerHTML = html;
    pagination.querySelectorAll(".page-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const p = parseInt(btn.dataset.page);
        if (p >= 1 && p <= pages) {
          state.page = p;
          render();
          window.scrollTo({ top: grid.offsetTop - 100, behavior: "smooth" });
        }
      });
    });
  }

  function render() {
    const filtered = applyFilters();
    renderStats(filtered);

    if (resultsInfo) {
      resultsInfo.innerHTML = filtered.length === members.length
        ? `<span aria-live="polite">${APP.t("showing_all")} <strong>${members.length}</strong> ${APP.t("showing_members")}</span>`
        : `<span aria-live="polite"><strong>${filtered.length}</strong> ${APP.t("showing_of")} ${members.length}</span>`;
    }

    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
      grid.innerHTML = `<div class="no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <p>${APP.t("no_results_title")}</p>
        <span>${APP.t("no_results_sub")}</span>
        <div class="mt-16">
          <button class="btn" id="clearFiltersBtn">${APP.t("clear_filters")}</button>
        </div>
      </div>`;
      const clearBtn = document.getElementById("clearFiltersBtn");
      if (clearBtn) clearBtn.addEventListener("click", () => {
        state = { q: "", party: "all", house: "all", alpha: "", sort: "name-asc", page: 1 };
        if (searchInput) searchInput.value = "";
        if (partySelect) partySelect.value = "all";
        if (sortSelect) sortSelect.value = "name-asc";
        buildAlphaRow();
        buildHouseToggle();
        render();
      });
    } else {
      grid.innerHTML = pageItems.map(cardHTML).join("");
      attachCardEvents();
    }
    renderPagination(filtered.length);
    pushState();
  }

  // ---- wire up controls ----
  if (searchInput) {
    const debouncedRender = APP.debounce(() => { state.q = searchInput.value; state.page = 1; render(); }, 300);
    searchInput.addEventListener("input", debouncedRender);
  }
  if (partySelect) {
    partySelect.addEventListener("change", () => { state.party = partySelect.value; state.page = 1; render(); });
  }
  if (sortSelect) {
    sortSelect.value = state.sort;
    sortSelect.addEventListener("change", () => { state.sort = sortSelect.value; render(); });
  }
  if (window.location.hash === "#focus-search" && searchInput) {
    searchInput.focus();
  }

  render();
})();

/* ---- Page bootstrap (was an inline <script> in directory.html; moved here
   because the site's CSP is script-src 'self' with no 'unsafe-inline', which
   silently blocks inline <script> blocks in the browser) ---- */
APP.renderHeader("directory.html");
APP.renderSubnav("nav_directory", "index.html", "nav_home");
APP.renderFooter();
APP.initScrollTop();
APP.initKeyboardShortcuts();
APP.initStickyFilterBar();
