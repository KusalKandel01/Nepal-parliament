/* ============================================================
   filters.js — powers directory.html: search, filters, sort,
   pagination, URL state, card rendering, quick actions.
   ============================================================ */

(async function () {
  const grid = document.getElementById("memberGrid");
  if (!grid) return;

  const searchInput = document.getElementById("searchInput");
  const partySelect = document.getElementById("partyFilter");
  const houseToggle = document.getElementById("houseToggle");
  const alphaRow = document.getElementById("alphaRow");
  const sortSelect = document.getElementById("sortSelect");
  const resultsInfo = document.getElementById("resultsInfo");
  const pagination = document.getElementById("pagination");
  const statsBar = document.getElementById("statsBar");

  const PAGE_SIZE = 24;
  let state = {
    q: "",
    party: "all",
    house: "all",
    alpha: "",
    sort: "name-asc",
    page: 1,
  };

  grid.innerHTML = APP.skeletonCards(12);

  let data;
  try {
    data = await APP.loadJSON("members.json");
  } catch (e) {
    grid.innerHTML = `<div class="no-results"><p>भार गर्न असफल भयो। कृपया पृष्ठ पुनः लोड गर्नुहोस्।</p><span>Failed to load member data. Please reload the page.</span></div>`;
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
    let html = `<option value="all">सबै दल (${members.length})</option>`;
    sorted.forEach(([code, n]) => {
      html += `<option value="${code}">${APP.escapeHtml(partyLabels[code] || code)} (${n})</option>`;
    });
    if (partySelect) partySelect.innerHTML = html;
  }
  buildPartyOptions();
  if (partySelect) partySelect.value = state.party;

  // ---- alphabet row (Devanagari) ----
  const DEV_ALPHA = ["अ","आ","इ","ई","उ","ऊ","ए","ऐ","ओ","औ","क","ख","ग","घ","च","छ","ज","झ","ट","ठ","ड","ढ","त","थ","द","ध","न","प","फ","ब","भ","म","य","र","ल","व","श","ष","स","ह"];
  function buildAlphaRow() {
    if (!alphaRow) return;
    let html = `<button class="alpha-btn${state.alpha === "" ? " active" : ""}" data-alpha="" title="सबै" aria-pressed="${state.alpha === ""}">सबै</button>`;
    DEV_ALPHA.forEach(ch => {
      html += `<button class="alpha-btn${state.alpha === ch ? " active" : ""}" data-alpha="${ch}" aria-pressed="${state.alpha === ch}">${ch}</button>`;
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
      <button data-house="all" class="${state.house === "all" ? "active" : ""}">सबै (${members.length})</button>
      <button data-house="HoR" class="${state.house === "HoR" ? "active" : ""}">प्रतिनिधि सभा (${hor})</button>
      <button data-house="NA" class="${state.house === "NA" ? "active" : ""}">राष्ट्रिय सभा (${na})</button>
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

  // ---- stats bar ----
  function renderStats(filtered) {
    if (!statsBar) return;
    const parties = new Set(members.map(m => m.party_code)).size;
    statsBar.innerHTML = `
      <div class="stat-item"><div class="num">${members.length}</div><div class="label">कुल सदस्य</div></div>
      <div class="stat-item"><div class="num">${parties}</div><div class="label">राजनीतिक दलहरू</div></div>
      <div class="stat-item"><div class="num">${filtered.length}</div><div class="label">फेला परेको</div></div>
    `;
  }

  // ---- filter + search + sort pipeline ----
  function applyFilters() {
    const q = state.q.trim().toLowerCase();
    let list = members.filter(m => {
      if (state.party !== "all" && m.party_code !== state.party) return false;
      if (state.house !== "all" && m.house !== state.house) return false;
      if (state.alpha && !(m.name_ne || "").startsWith(state.alpha)) return false;
      if (q) {
        const hay = [m.name_ne, m.name_en, m.district, m.party_ne, ...(m.phones||[]), ...(m.emails||[])]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    switch (state.sort) {
      case "name-asc": list.sort((a, b) => (a.name_ne||"").localeCompare(b.name_ne||"", "ne")); break;
      case "name-desc": list.sort((a, b) => (b.name_ne||"").localeCompare(a.name_ne||"", "ne")); break;
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
    const initial = (m.name_ne || "?").replace(/^मा\.\s*/, "").replace(/^डा\.\s*/, "").trim().charAt(0);
    const avatarInner = m.photo
      ? `<img src="${m.photo}" alt="" width="52" height="52" loading="lazy" onerror="this.parentElement.innerHTML='${initial}'">`
      : initial;
    const phone = m.phones && m.phones[0];
    const email = m.emails && m.emails[0];

    return `
      <article class="member-card" style="--party-color:${color}" data-id="${m.id}">
        <span class="badge-house">${m.house === "HoR" ? "HoR" : "NA"} · ${m.id.replace("MP","#")}</span>
        <div class="card-top">
          <div class="avatar">${avatarInner}</div>
          <div class="card-body">
            ${m.role ? `<span class="role-pill">${APP.escapeHtml(m.role)}</span>` : ""}
            <h3 class="card-name">${APP.highlight(m.name_ne, state.q)}<span class="name-en" lang="en">${APP.highlight(m.name_en || "", state.q)}</span></h3>
            <span class="card-party">${APP.escapeHtml(m.party_ne || "—")}</span>
          </div>
        </div>
        <div class="card-meta">
          <div class="meta-row">${APP.ICONS_PIN || ""}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>${APP.highlight(m.district || "उल्लेख नभएको", state.q)}</span></div>
          ${phone
            ? `<div class="meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><a class="link" href="tel:+977${phone}">${phone}</a></div>`
            : `<div class="meta-row empty">फोन उपलब्ध छैन</div>`}
          ${email
            ? `<div class="meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg><a class="link" href="mailto:${email}">${email}</a></div>`
            : `<div class="meta-row empty">इमेल उपलब्ध छैन</div>`}
        </div>
        <div class="card-actions">
          ${phone ? `<button class="action-btn whatsapp" data-action="whatsapp" data-phone="${phone}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.83.494 3.626 1.432 5.2L2 22l4.933-1.408A9.945 9.945 0 0 0 12.001 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.2c-1.65 0-3.263-.444-4.666-1.286l-.334-.198-2.929.836.85-2.858-.217-.34A8.19 8.19 0 0 1 3.8 12c0-4.526 3.674-8.2 8.2-8.2s8.2 3.674 8.2 8.2-3.674 8.2-8.2 8.2z"/></svg><span class="tooltip">WhatsApp</span></button>` : ""}
          <button class="action-btn copy" data-action="copy" data-phone="${phone||""}" data-email="${email||""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span class="tooltip">फोन/इमेल कपी</span></button>
          <button class="action-btn" data-action="vcard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span class="tooltip">vCard डाउनलोड</span></button>
          <button class="action-btn save${isSaved ? " saved" : ""}" data-action="save"><svg viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span class="tooltip">${isSaved ? "साभार गरिएको" : "साभार गर्नुहोस्"}</span></button>
          <a class="action-btn" href="member.html?id=${m.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span class="tooltip">पूर्ण प्रोफाइल</span></a>
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
            APP.copyText(text, text === btn.dataset.phone ? "फोन नम्बर" : "इमेल");
            btn.classList.add("copied");
            setTimeout(() => btn.classList.remove("copied"), 1200);
          } else if (action === "vcard") {
            APP.downloadFile(`${(member.name_en||member.id).replace(/\s+/g,"_")}.vcf`, APP.vCard(member), "text/vcard");
          } else if (action === "save") {
            const nowSaved = toggleSaved(id);
            btn.classList.toggle("saved", nowSaved);
            btn.querySelector(".tooltip").textContent = nowSaved ? "साभार गरिएको" : "साभार गर्नुहोस्";
            APP.toast(nowSaved ? "प्रोफाइल साभार गरियो" : "साभारबाट हटाइयो");
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

    let html = `<button class="page-btn" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""} aria-label="अघिल्लो">‹</button>`;
    const windowSize = 2;
    for (let p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || Math.abs(p - state.page) <= windowSize) {
        html += `<button class="page-btn${p === state.page ? " active" : ""}" data-page="${p}" ${p === state.page ? 'aria-current="page"' : ""}>${p}</button>`;
      } else if (Math.abs(p - state.page) === windowSize + 1) {
        html += `<span class="page-ellipsis">…</span>`;
      }
    }
    html += `<button class="page-btn" data-page="${state.page + 1}" ${state.page === pages ? "disabled" : ""} aria-label="अर्को">›</button>`;
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
        ? `<span aria-live="polite">जम्मा <strong>${members.length}</strong> सदस्यहरू देखाइँदै</span>`
        : `<span aria-live="polite"><strong>${filtered.length}</strong> सदस्यहरू फेला परे, जम्मा ${members.length} मध्ये</span>`;
    }

    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
      grid.innerHTML = `<div class="no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <p>कुनै सदस्य फेला परेन</p>
        <span>खोज वा फिल्टर मापदण्ड परिवर्तन गरी पुनः प्रयास गर्नुहोस्</span>
        <div style="margin-top:16px;">
          <button class="btn" id="clearFiltersBtn">सबै फिल्टर हटाउनुहोस्</button>
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
