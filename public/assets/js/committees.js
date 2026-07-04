/* ============================================================
   committees.js — powers committees.html: tabs by house, renders
   committee cards with chair/secretary contact and cross-links
   to the chairperson's full member profile when identifiable.
   ============================================================ */

(async function () {
  const list = document.getElementById("committeeList");
  const tabs = document.getElementById("committeeTabs");
  let committees = [];
  let memberIndex = {};

  try {
    const data = await APP.loadJSON("committees.json");
    committees = data.committees;
  } catch (e) {
    list.innerHTML = `<div class="no-results"><p>लोड गर्न असफल भयो। पृष्ठ पुनः लोड गर्नुहोस्।</p></div>`;
    APP.announce("समिति डाटा लोड गर्न असफल भयो");
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

  const houseLabel = { HoR: "प्रतिनिधि सभा", NA: "राष्ट्रिय सभा", Joint: "संयुक्त समिति" };

  function personMarkup(nameNe) {
    if (!nameNe) return "—";
    const key = nameNe.replace(/^श्री\s*|^मा\.\s*|^डा\.\s*/, "").trim();
    const id = memberIndex[key];
    return id ? `<a href="member.html?id=${id}">${APP.escapeHtml(nameNe)}</a>` : APP.escapeHtml(nameNe);
  }

  function render(filter) {
    const items = filter === "all" ? committees : committees.filter(c => c.house === filter);
    if (!items.length) {
      list.innerHTML = `<div class="no-results"><p>यस श्रेणीमा कुनै समिति फेला परेन</p></div>`;
      return;
    }
    list.innerHTML = items.map(c => `
      <div class="committee-card">
        <h3>${APP.escapeHtml(c.name_ne)}<span class="committee-badge">${houseLabel[c.house]}</span>${!c.verified ? '<span class="needs-review">⚠ पुष्टि हुन बाँकी</span>' : ""}</h3>
        <div class="en">${APP.enSpan(c.name_en)}</div>
        <div class="committee-people">
          <div><div class="role">सभापति</div>${personMarkup(c.chair_ne)} ${c.chair_office ? `· <a href="tel:${c.chair_office.replace(/\D/g,'')}">${c.chair_office}</a>` : ""}</div>
          ${c.secretary_ne ? `<div><div class="role">सचिव</div>${personMarkup(c.secretary_ne)} ${c.secretary_office ? `· <a href="tel:${c.secretary_office.replace(/\D/g,'')}">${c.secretary_office}</a>` : ""}</div>` : ""}
          ${c.email ? `<div><div class="role">इमेल</div><a href="mailto:${c.email}">${c.email}</a></div>` : ""}
        </div>
      </div>
    `).join("");
    APP.announce(`${items.length} समिति देखाइँदै`);
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
