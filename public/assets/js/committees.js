/* ============================================================
   committees.js, powers committees.html: tabs by house, renders
   committee cards with chair/secretary contact and cross-links
   to the chairperson's full member profile when identifiable.
   ============================================================ */

(async function () {
  const list = document.getElementById("committeeList");
  const tabs = document.getElementById("committeeTabs");
  const lang = APP.getLang();
  let committees = [];
  let memberIndex = {};

  try {
    const data = await APP.loadJSON("committees.json");
    committees = data.committees;
  } catch (e) {
    list.innerHTML = `<div class="no-results"><p>${APP.t("load_failed")}</p></div>`;
    APP.announce(APP.t("load_failed"));
    return;
  }

  try {
    const members = await APP.loadJSON("members.json");
    members.members.forEach(m => {
      const key = (m.name_ne || "").replace(/^मा\.\s*|^डा\.\s*/, "").trim();
      if (key) memberIndex[key] = m.id;
    });
  } catch (e) {
    // Cross-linking is a progressive enhancement only.
  }

  const houseLabel = { HoR: APP.t("house_hor"), NA: APP.t("house_na"), Joint: APP.t("tab_joint") };

  // Populate tab labels + live counts (was hardcoded before; now always accurate).
  const counts = { all: committees.length };
  committees.forEach(c => { counts[c.house] = (counts[c.house] || 0) + 1; });
  const tabLabels = { all: APP.t("tab_all"), HoR: APP.t("tab_hor"), NA: APP.t("tab_na"), Joint: APP.t("tab_joint") };
  tabs.querySelectorAll(".tab-btn").forEach(btn => {
    const key = btn.dataset.house;
    btn.textContent = `${tabLabels[key]} (${counts[key] || 0})`;
  });

  function personMarkup(nameNe, nameEn) {
    if (!nameNe) return "N/A";
    const key = nameNe.replace(/^श्री\s*|^मा\.\s*|^डा\.\s*/, "").trim();
    const id = memberIndex[key];
    const showEn = lang === "en" && nameEn;
    const label = APP.escapeHtml(showEn ? nameEn : nameNe);
    const inner = id ? `<a href="member.html?id=${id}">${label}</a>` : label;
    const unverifiedNote = (lang === "en" && !nameEn)
      ? ` <span class="name-unverified" title="${APP.t("name_en_unverified_hint")}">${APP.t("name_en_unverified_badge")}</span>`
      : "";
    return inner + unverifiedNote;
  }

  function render(filter) {
    const items = filter === "all" ? committees : committees.filter(c => c.house === filter);
    if (!items.length) {
      list.innerHTML = `<div class="no-results"><p>${APP.t("committees_no_match")}</p></div>`;
      return;
    }
    list.innerHTML = items.map(c => {
      const primaryName = lang === "en" ? (c.name_en || c.name_ne) : c.name_ne;
      const secondaryName = lang === "en" ? c.name_ne : (c.name_en || "");
      const secondaryAttr = lang === "en" ? 'lang="ne" translate="no"' : 'lang="en"';
      return `
      <div class="committee-card">
        <h3>${APP.escapeHtml(primaryName)}<span class="committee-badge">${houseLabel[c.house]}</span>${!c.verified ? `<span class="needs-review">${APP.t("needs_review")}</span>` : ""}</h3>
        <div class="en" ${secondaryAttr}>${APP.escapeHtml(secondaryName)}</div>
        <div class="committee-people">
          <div><div class="role">${APP.t("committee_chair_role")}</div>${personMarkup(c.chair_ne, c.chair_en)} ${c.chair_office ? `· <a href="tel:${c.chair_office.replace(/\D/g,'')}" translate="no">${c.chair_office}</a>` : ""}</div>
          ${c.secretary_ne ? `<div><div class="role">${APP.t("committee_secretary_role")}</div>${personMarkup(c.secretary_ne, c.secretary_en)} ${c.secretary_office ? `· <a href="tel:${c.secretary_office.replace(/\D/g,'')}" translate="no">${c.secretary_office}</a>` : ""}</div>` : ""}
          ${c.email ? `<div><div class="role">${APP.t("committee_email_role")}</div><a href="mailto:${c.email}" translate="no">${c.email}</a></div>` : ""}
        </div>
      </div>
    `;
    }).join("");
    APP.announce(`${items.length}`);
  }

  tabs.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.querySelectorAll(".tab-btn").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      render(btn.dataset.house);
    });
  });

  render("all");
})();

/* ---- Page bootstrap (was an inline <script> in committees.html; moved here
   because the site's CSP is script-src 'self' with no 'unsafe-inline') ---- */
APP.renderHeader("committees.html");
APP.renderSubnav("nav_committees", "index.html", "nav_home");
APP.renderFooter();
APP.initScrollTop();
