/* ============================================================
   home.js, powers the rebuilt index.html: hero search suggestions,
   stats bar, national "key offices" spotlight, party composition
   chart, and the five chamber-leadership cards. Replaces the old
   bespoke WebGL homepage (see CHANGELOG) — this file only uses the
   same data and rendering patterns already established elsewhere
   in the site (filters.js / statistics.js / leadership.js /
   government.js), so nothing here is new or unverified.
   ============================================================ */

(async function () {
  const lang = APP.getLang();

  let members, stats, leadershipData, govData;
  try {
    [members, stats, leadershipData, govData] = await Promise.all([
      APP.loadJSON("members.json"),
      APP.loadJSON("statistics.json"),
      APP.loadJSON("leadership.json"),
      APP.loadJSON("government_sites.json"),
    ]);
  } catch (e) {
    APP.announce(APP.t("member_load_failed"));
    return;
  }

  const memberList = members.members;

  /* ---------------- Hero search ---------------- */
  (function initHeroSearch() {
    const input = document.getElementById("heroSearchInput");
    const box = document.getElementById("heroSuggestions");
    if (!input || !box) return;

    function nameFor(m) { return lang === "en" ? (m.name_en || m.name_ne) : m.name_ne; }
    function initialFor(m) {
      return lang === "en"
        ? (m.name_en || m.name_ne || "?").trim().charAt(0)
        : (m.name_ne || "?").replace(/^मा\.\s*/, "").replace(/^डा\.\s*/, "").trim().charAt(0);
    }

    function render(query) {
      const q = query.trim().toLowerCase();
      if (!q) { box.innerHTML = ""; box.hidden = true; return; }
      const matches = memberList.filter((m) => {
        const hay = [m.name_ne, m.name_en, m.district, m.party_ne, m.party_code, ...(m.phones || [])]
          .filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      }).slice(0, 7);

      if (!matches.length) {
        box.innerHTML = `<div class="suggest-empty">${APP.t("suggest_no_match")}</div>`;
        box.hidden = false;
        return;
      }

      box.innerHTML = matches.map((m) => `
        <a class="suggest-item" href="member.html?id=${m.id}">
          <span class="suggest-avatar" style="background:${APP.partyColorVar(m.party_code)}" translate="no">${APP.escapeHtml(initialFor(m))}</span>
          <span class="suggest-text">
            <span class="suggest-name">${APP.highlight(nameFor(m), query)}</span>
            <span class="suggest-meta">${APP.escapeHtml(APP.districtLabelFor(m.district) || APP.t("district_unspecified"))} · ${APP.escapeHtml(APP.partyLabelFor(m.party_code, m.party_ne) || "")}</span>
          </span>
        </a>`).join("") +
        `<a class="suggest-all" href="directory.html?q=${encodeURIComponent(query)}">${APP.t("suggest_view_all")}</a>`;
      box.hidden = false;
    }

    input.addEventListener("input", APP.debounce(() => render(input.value), 180));
    input.addEventListener("focus", () => { if (input.value.trim()) render(input.value); });
    document.addEventListener("click", (e) => {
      if (!box.contains(e.target) && e.target !== input) box.hidden = true;
    });
  })();

  /* ---------------- Stats bar ---------------- */
  const statsBar = document.getElementById("statsBar");
  if (statsBar) {
    statsBar.innerHTML = `
      <div class="stat-item"><div class="num">${stats.total_members}</div><div class="label">${APP.t("stat_total")}</div></div>
      <div class="stat-item"><div class="num">${stats.by_house.HoR}</div><div class="label">${APP.t("stat_hor")}</div></div>
      <div class="stat-item"><div class="num">${stats.by_house.NA}</div><div class="label">${APP.t("stat_na")}</div></div>
      <div class="stat-item"><div class="num">${(govData.ministries || []).length}</div><div class="label">${APP.t("stat_ministries")}</div></div>
    `;
  }

  /* ---------------- Key national offices (President / VP / Chief Justice) ---------------- */
  const keyOfficesGrid = document.getElementById("keyOfficesGrid");
  if (keyOfficesGrid) {
    const offices = (govData.national_leadership || []).filter((o) => o.id !== "primeminister");
    keyOfficesGrid.innerHTML = offices.map((o) => {
      const name = lang === "en" ? o.name_en : o.name_ne;
      const holder = lang === "en" ? o.minister : (o.minister_ne || o.minister);
      const extra = lang === "en" ? o.extra : (o.extra_ne || o.extra);
      return `
        <article class="gov-card">
          <h3 class="gov-name">${APP.escapeHtml(name)}</h3>
          <p class="gov-minister"><strong>${APP.t("gov_titleholder_label")}:</strong> <span translate="no">${APP.escapeHtml(holder)}</span></p>
          ${extra ? `<p class="gov-extra">${APP.escapeHtml(extra)}</p>` : ""}
        </article>`;
    }).join("");
  }

  /* ---------------- Party composition chart ---------------- */
  const donutMount = document.getElementById("homePartyDonut");
  const legendMount = document.getElementById("homePartyLegend");
  if (donutMount && legendMount && typeof CHARTS !== "undefined") {
    const partyEntries = Object.entries(stats.by_party).sort((a, b) => b[1] - a[1]);
    const segments = partyEntries.map(([code, val]) => ({
      label: `${APP.partyLabelFor(code, stats.party_labels[code])} (${code})`,
      value: val,
      color: APP.partyColorVar(code),
    }));
    CHARTS.donut(donutMount, segments, { size: 200, centerLabel: APP.t("chart_members_label") });
    legendMount.innerHTML = partyEntries.map(([code, val]) => `
      <div class="legend-row">
        <span class="legend-swatch" style="background:${APP.partyColorVar(code)}"></span>
        <span class="legend-label">${APP.escapeHtml(APP.partyLabelFor(code, stats.party_labels[code]))} <span class="code" translate="no">(${code})</span></span>
        <strong translate="no">${val}</strong>
      </div>`).join("");
  }

  /* ---------------- Chamber leadership cards (Speaker...PM) ---------------- */
  const leaderGrid = document.getElementById("homeLeaderGrid");
  if (leaderGrid) {
    const memberIndex = {};
    memberList.forEach((m) => {
      const key = (m.name_ne || "").replace(/^मा\.\s*|^डा\.\s*/, "").trim();
      if (key) memberIndex[key] = m.id;
    });

    leaderGrid.innerHTML = leadershipData.leadership.map((l) => {
      const initial = lang === "en"
        ? (l.name_en || l.name_ne || "?").trim().charAt(0)
        : (l.name_ne || "?").replace(/^मा\.\s*/, "").replace(/^श्री\s*/, "").trim().charAt(0);
      const avatarInner = l.photo
        ? `<div class="avatar-lg has-photo"><img alt="" data-fallback-initial="${APP.escapeHtml(initial)}" height="72" src="${l.photo}" width="72"></div>`
        : `<div aria-hidden="true" class="avatar-lg" translate="no">${initial}</div>`;
      const key = (l.name_ne || "").replace(/^मा\.\s*|^डा\.\s*/, "").trim();
      const memberId = memberIndex[key];
      const primaryName = lang === "en" ? (l.name_en || l.name_ne) : l.name_ne;
      const nameMarkup = memberId
        ? `<a href="member.html?id=${memberId}">${APP.escapeHtml(primaryName)}</a>`
        : APP.escapeHtml(primaryName);
      const roleLabel = lang === "en" ? (l.role_code || l.role_ne) : l.role_ne;
      const houseLabel = l.house === "HoR" ? APP.t("house_hor") : l.house === "NA" ? APP.t("house_na") : "";
      return `
        <div class="leader-card">
          ${avatarInner}
          <div class="leader-role">${APP.escapeHtml(roleLabel)}${houseLabel ? " · " + houseLabel : ""}</div>
          <h3>${nameMarkup}</h3>
          <div class="leader-contact">
            ${l.office_phone ? `<div><a href="tel:${l.office_phone.replace(/\D/g, "")}" translate="no">${l.office_phone}</a></div>` : `<div class="empty-note">${APP.t("office_phone_unavailable")}</div>`}
            ${l.email ? `<div><a href="mailto:${l.email}" translate="no">${l.email}</a></div>` : ""}
          </div>
        </div>`;
    }).join("");
  }
})();

/* ---- Page bootstrap (CSP is script-src 'self' with no 'unsafe-inline') ---- */
APP.renderHeader("index.html");
APP.renderFooter();
APP.initScrollTop();
