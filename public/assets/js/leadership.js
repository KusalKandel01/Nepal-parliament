/* ============================================================
   leadership.js — powers leadership.html: renders Speaker,
   Deputy Speaker, Chairperson, Vice Chairperson, PM cards and
   the political party parliamentary-office contact table.
   ============================================================ */

(async function () {
  const grid = document.getElementById("leaderGrid");
  const tbody = document.querySelector("#partyOfficeTable tbody");

  let data, memberIndex = {};
  try {
    data = await APP.loadJSON("leadership.json");
  } catch (e) {
    grid.innerHTML = `<div class="no-results"><p>लोड गर्न असफल भयो। पृष्ठ पुनः लोड गर्नुहोस्।</p></div>`;
    APP.announce("नेतृत्व डाटा लोड गर्न असफल भयो");
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
    const key = (l.name_ne || "").replace(/^मा\.\s*|^डा\.\s*/, "").trim();
    const memberId = memberIndex[key];
    const nameMarkup = memberId
      ? `<a href="member.html?id=${memberId}">${APP.escapeHtml(l.name_ne)}</a>`
      : APP.escapeHtml(l.name_ne);
    return `
      <div class="leader-card">
        <div class="avatar-lg" aria-hidden="true">${initial}</div>
        <div class="leader-role">${APP.escapeHtml(l.role_ne)} · ${l.house === "HoR" ? "प्रतिनिधि सभा" : l.house === "NA" ? "राष्ट्रिय सभा" : "सरकार"}</div>
        <h3>${nameMarkup}</h3>
        <div class="en">${APP.enSpan(l.name_en)}</div>
        <div class="leader-contact">
          ${l.office_phone ? `<div><a href="tel:${l.office_phone.replace(/\D/g,"")}">${l.office_phone}</a></div>` : `<div class="empty-note">कार्यालय फोन उपलब्ध छैन</div>`}
          ${l.email ? `<div><a href="mailto:${l.email}">${l.email}</a></div>` : ""}
          ${!l.verified ? `<div class="needs-review">⚠ स्रोत पुष्टि हुन बाँकी</div>` : ""}
        </div>
      </div>
    `;
  }).join("");

  tbody.innerHTML = data.party_offices.map(p => `
    <tr>
      <td><strong>${p.party_code}</strong> — ${APP.escapeHtml(p.party_ne)}</td>
      <td>${p.parliamentary_office ? `<a href="tel:${p.parliamentary_office.replace(/\D/g,'')}">${p.parliamentary_office}</a>` : "—"}</td>
      <td>${p.staff_office || "—"}</td>
    </tr>
  `).join("");

  APP.announce(`${data.leadership.length} नेतृत्व सम्पर्क लोड भयो`);
})();
