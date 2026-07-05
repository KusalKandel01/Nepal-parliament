/* ============================================================
   member.js — powers member.html: loads a single member by
   ?id=, renders the profile card, wires up quick actions,
   and injects dynamic SEO metadata (title/description/canonical/
   Open Graph/Person schema) since this is a client-rendered page.
   ============================================================ */

(async function () {
  const mount = document.getElementById("profileMount");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    mount.innerHTML = `<div class="panel"><p>कुनै सदस्य ID दिइएको छैन। कृपया निर्देशिकाबाट कुनै सदस्य छान्नुहोस्।</p></div>`;
    APP.announce("कुनै सदस्य ID दिइएको छैन");
    return;
  }

  let data;
  try {
    data = await APP.loadJSON("members.json");
  } catch (e) {
    mount.innerHTML = `<div class="panel"><p>डाटा लोड गर्न असफल भयो। <a href="member.html?id=${APP.escapeHtml(id)}">पुनः प्रयास गर्नुहोस्</a>।</p></div>`;
    APP.announce("डाटा लोड गर्न असफल भयो");
    return;
  }

  const m = data.members.find(x => x.id === id);
  if (!m) {
    mount.innerHTML = `<div class="panel"><p>सदस्य फेला परेन। यो ID अवस्थित छैन: <strong>${APP.escapeHtml(id)}</strong></p><p><a href="directory.html">सम्पूर्ण निर्देशिका हेर्नुहोस् →</a></p></div>`;
    APP.announce("सदस्य फेला परेन");
    return;
  }

  const phone = m.phones && m.phones[0];
  const email = m.emails && m.emails[0];

  /* ---- Dynamic SEO: title, description, canonical, OG, Person schema ---- */
  document.title = `${m.name_ne} | संघीय संसद सम्पर्क निर्देशिका`;
  document.getElementById("pageTitle").textContent = document.title;
  APP.renderSubnav(m.name_ne, "directory.html", "सदस्य निर्देशिका");
  const desc = `${m.name_en || m.name_ne} — ${m.party_ne || ""}, ${m.district || ""}. ${m.house === "HoR" ? "House of Representatives" : "National Assembly"} member contact: phone, email.`;
  document.getElementById("pageDescription").setAttribute("content", desc);
  document.getElementById("ogTitle").setAttribute("content", document.title);
  document.getElementById("ogDescription").setAttribute("content", desc);
  document.getElementById("pageCanonical").setAttribute("href", `https://nepal-parliament-directory.vercel.app/member.html?id=${encodeURIComponent(m.id)}`);

  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": m.name_en || m.name_ne,
    "alternateName": m.name_ne,
    "jobTitle": m.role || (m.house === "HoR" ? "Member, House of Representatives" : "Member, National Assembly"),
    "affiliation": { "@type": "PoliticalParty", "name": m.party_ne },
    "telephone": phone ? `+977${phone}` : undefined,
    "email": email || undefined,
    "address": { "@type": "PostalAddress", "addressLocality": m.district || undefined, "addressCountry": "NP" },
    "image": m.photo || undefined
  });
  document.head.appendChild(ld);

  /* ---- Cross-link: committees this member chairs (if any) ---- */
  let committeeLinks = "";
  try {
    const committeeData = await APP.loadJSON("committees.json");
    const chaired = committeeData.committees.filter(c =>
      c.chair_ne && m.name_ne && c.chair_ne.replace(/^श्री\s*|^मा\.\s*/, "").trim() === m.name_ne.replace(/^मा\.\s*|^डा\.\s*/, "").trim()
    );
    if (chaired.length) {
      committeeLinks = `
        <div class="detail-item detail-item-wide">
          <div class="k">सभापतित्व गरेको समिति</div>
          <div class="v">${chaired.map(c => `<a href="committees.html">${APP.escapeHtml(c.name_ne)}</a>`).join(", ")}</div>
        </div>`;
    }
  } catch (e) {
    // Non-critical enhancement; fail silently if committees.json is unavailable.
  }

  /* ---- Render ---- */
  const color = APP.partyColorVar(m.party_code);
  const initial = (m.name_ne || "?").replace(/^मा\.\s*/, "").replace(/^डा\.\s*/, "").trim().charAt(0);
  const avatarInner = m.photo
    ? `<img src="${m.photo}" alt="" width="96" height="96" onerror="this.parentElement.innerHTML='${initial}'">`
    : initial;

  mount.innerHTML = `
    <div class="profile-card party-accent" data-party-color="${color}">
      <div class="profile-top">
        <div class="profile-avatar">${avatarInner}</div>
        <div>
          ${m.role ? `<span class="role-pill">${APP.escapeHtml(m.role)}</span>` : ""}
          <h1 class="profile-name">${APP.escapeHtml(m.name_ne)}${APP.enSpan(m.name_en)}</h1>
          <span class="profile-party">${APP.escapeHtml(m.party_ne || "—")}</span>
        </div>
      </div>

      <div class="profile-details">
        <div class="detail-item">
          <div class="k">सदन</div>
          <div class="v">${m.house === "HoR" ? "प्रतिनिधि सभा" : "राष्ट्रिय सभा"}</div>
        </div>
        <div class="detail-item">
          <div class="k">जिल्ला / प्रदेश</div>
          <div class="v">${APP.escapeHtml(m.district || "उल्लेख नभएको")}</div>
        </div>
        <div class="detail-item">
          <div class="k">फोन नम्बर</div>
          <div class="v">${phone ? `<a href="tel:+977${phone}">${phone}</a>` : "उपलब्ध छैन"}</div>
        </div>
        <div class="detail-item">
          <div class="k">इमेल</div>
          <div class="v">${email ? `<a href="mailto:${email}">${email}</a>` : "उपलब्ध छैन"}</div>
        </div>
        <div class="detail-item">
          <div class="k">सदस्य ID</div>
          <div class="v">${m.id}</div>
        </div>
        <div class="detail-item">
          <div class="k">दल कोड</div>
          <div class="v">${m.party_code}</div>
        </div>
        ${committeeLinks}
      </div>

      <div class="profile-actions">
        ${phone ? `<a class="btn whatsapp-btn" id="waBtn" target="_blank" rel="noopener">${APP.ICONS.whatsapp}WhatsApp</a>` : ""}
        <button class="btn primary" id="vcardBtn">${APP.ICONS.download}vCard डाउनलोड</button>
        <button class="btn" id="copyBtn">${APP.ICONS.copy}सम्पर्क कपी</button>
        <button class="btn" id="shareBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>साझा गर्नुहोस्</button>
        <button class="btn" id="printProfileBtn">${APP.ICONS.printer}प्रिन्ट</button>
        <a class="btn" id="reportBtn" href="mailto:corrections@example.org?subject=${encodeURIComponent('Data correction: ' + (m.name_en || m.name_ne) + ' (' + m.id + ')')}">${APP.ICONS.info}त्रुटि सूचित गर्नुहोस्</a>
      </div>
    </div>
  `;
  document.querySelector(".profile-card").style.setProperty("--party-color", color);
  APP.announce(`${m.name_ne} को प्रोफाइल लोड भयो`);

  if (phone) document.getElementById("waBtn").href = APP.whatsappLink(phone);
  document.getElementById("vcardBtn").addEventListener("click", () => {
    APP.downloadFile(`${(m.name_en || m.id).replace(/\s+/g, "_")}.vcf`, APP.vCard(m), "text/vcard");
  });
  document.getElementById("copyBtn").addEventListener("click", () => {
    const parts = [m.name_en || m.name_ne, phone, email].filter(Boolean);
    APP.copyText(parts.join(" · "), "सम्पर्क विवरण");
  });
  document.getElementById("shareBtn").addEventListener("click", async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: m.name_en || m.name_ne, url }); }
      catch (e) { /* user cancelled the native share sheet */ }
    } else {
      APP.copyText(url, "लिङ्क");
    }
  });
  document.getElementById("printProfileBtn").addEventListener("click", () => window.print());
})();
