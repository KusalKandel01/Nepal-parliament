/* ============================================================
   leadership.js, powers leadership.html: renders Speaker,
   Deputy Speaker, Chairperson, Vice Chairperson, PM cards and
   the political party parliamentary-office contact table.
   ============================================================ */

(async function () {
  const grid = document.getElementById("leaderGrid");
  const tbody = document.querySelector("#partyOfficeTable tbody");
  const lang = APP.getLang();

  let data, memberIndex = {};
  try {
    data = await APP.loadJSON("leadership.json");
  } catch (e) {
    grid.innerHTML = `<div class="no-results"><p>${APP.t("load_failed")}</p></div>`;
    APP.announce(APP.t("load_failed"));
    return;
  }

  // Best-effort cross-link to full member profile, if this leader also
  // appears in the main member roster (most leadership roles do).
  try {
    const members = await APP.loadJSON("members.json");
    members.members.forEach(m => {
      const key = (m.name_ne || "").replace(/^मा\.\s*|^डा\.\s*/, "").trim();
      if (key) memberIndex[key] = m.id;
    });
  } catch (e) {
    // Cross-linking is a progressive enhancement; safe to skip if it fails.
  }

  grid.innerHTML = data.leadership.map(l => {
    const initial = (l.name_ne || "?").replace(/^मा\.\s*/, "").replace(/^श्री\s*/, "").trim().charAt(0);
    const avatarInner = l.photo
      ? `<div class="avatar-lg has-photo"><img src="${l.photo}" alt="" width="72" height="72" data-fallback-initial="${APP.escapeHtml(initial)}"></div>`
      : `<div class="avatar-lg" aria-hidden="true" translate="no">${initial}</div>`;
    const key = (l.name_ne || "").replace(/^मा\.\s*|^डा\.\s*/, "").trim();
    const memberId = memberIndex[key];
    const primaryName = lang === "en" ? (l.name_en || l.name_ne) : l.name_ne;
    const secondaryName = lang === "en" ? l.name_ne : (l.name_en || "");
    const secondaryAttr = lang === "en" ? 'lang="ne" translate="no"' : 'lang="en"';
    const nameMarkup = memberId
      ? `<a href="member.html?id=${memberId}">${APP.escapeHtml(primaryName)}</a>`
      : APP.escapeHtml(primaryName);
    const roleLabel = lang === "en" ? (l.role_code || l.role_ne) : l.role_ne;
    const houseLabel = l.house === "HoR" ? APP.t("house_hor") : l.house === "NA" ? APP.t("house_na") : APP.t("government");
    return `
      <div class="leader-card">
        ${avatarInner}
        <div class="leader-role">${APP.escapeHtml(roleLabel)} · ${houseLabel}</div>
        <h3>${nameMarkup}</h3>
        <div class="en" ${secondaryAttr}>${APP.escapeHtml(secondaryName)}</div>
        <div class="leader-contact">
          ${l.office_phone ? `<div><a href="tel:${l.office_phone.replace(/\D/g,"")}" translate="no">${l.office_phone}</a></div>` : `<div class="empty-note">${APP.t("office_phone_unavailable")}</div>`}
          ${l.email ? `<div><a href="mailto:${l.email}" translate="no">${l.email}</a></div>` : ""}
          ${!l.verified ? `<div class="needs-review">${APP.t("needs_review")}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");

  tbody.innerHTML = data.party_offices.map(p => `
    <tr>
      <td><strong translate="no">${p.party_code}</strong> · ${APP.escapeHtml(APP.partyLabelFor(p.party_code, p.party_ne))}</td>
      <td>${p.parliamentary_office ? `<a href="tel:${p.parliamentary_office.replace(/\D/g,'')}" translate="no">${p.parliamentary_office}</a>` : "N/A"}</td>
      <td translate="no">${p.staff_office || "N/A"}</td>
    </tr>
  `).join("");

  APP.announce(`${data.leadership.length}`);
})();

/* ---- Page bootstrap (was an inline <script> in leadership.html; moved here
   because the site's CSP is script-src 'self' with no 'unsafe-inline') ---- */
APP.renderHeader("leadership.html");
APP.renderSubnav("nav_leadership", "index.html", "nav_home");
APP.renderFooter();
APP.initScrollTop();
