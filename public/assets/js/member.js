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
  const lang = APP.getLang();

  if (!id) {
    mount.innerHTML = `<div class="panel"><p>${APP.t("member_no_id")}</p></div>`;
    APP.announce(APP.t("member_no_id"));
    return;
  }

  let data;
  try {
    data = await APP.loadJSON("members.json");
  } catch (e) {
    mount.innerHTML = `<div class="panel"><p>${APP.t("member_load_failed")} <a href="member.html?id=${APP.escapeHtml(id)}">${APP.t("retry")}</a>.</p></div>`;
    APP.announce(APP.t("member_load_failed"));
    return;
  }

  const m = data.members.find(x => x.id === id);
  if (!m) {
    mount.innerHTML = `<div class="panel"><p>${APP.t("member_not_found")} <strong>${APP.escapeHtml(id)}</strong></p><p><a href="directory.html">${APP.t("view_full_directory")}</a></p></div>`;
    APP.announce(APP.t("member_not_found"));
    return;
  }

  const phone = m.phones && m.phones[0];
  const email = m.emails && m.emails[0];

  /* ---- Dynamic SEO: title, description, canonical, OG, Person schema ---- */
  document.title = `${m.name_ne} | संघीय संसद सम्पर्क निर्देशिका`;
  document.getElementById("pageTitle").textContent = document.title;
  APP.renderSubnav(m.name_ne, "directory.html", "nav_directory");
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
          <div class="k">${APP.t("profile_committee_chair")}</div>
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
    ? `<img src="${m.photo}" alt="" width="96" height="96" data-fallback-initial="${APP.escapeHtml(initial)}">`
    : `<span translate="no">${initial}</span>`;

  const primaryName = lang === "en" ? (m.name_en || m.name_ne) : m.name_ne;
  const secondaryName = lang === "en" ? m.name_ne : (m.name_en || "");
  const secondaryLangAttr = lang === "en" ? 'lang="ne" translate="no"' : 'lang="en"';

  mount.innerHTML = `
    <div class="profile-card party-accent" data-party-color="${color}">
      <div class="profile-top">
        <div class="profile-avatar">${avatarInner}</div>
        <div>
          ${m.role ? `<span class="role-pill">${APP.escapeHtml(m.role)}</span>` : ""}
          <h1 class="profile-name">${APP.escapeHtml(primaryName)}<span class="en" ${secondaryLangAttr}>${APP.escapeHtml(secondaryName)}</span></h1>
          <span class="profile-party">${APP.escapeHtml(APP.partyLabelFor(m.party_code, m.party_ne) || "—")}</span>
        </div>
      </div>

      <div class="profile-details">
        <div class="detail-item">
          <div class="k">${APP.t("profile_house")}</div>
          <div class="v">${m.house === "HoR" ? APP.t("house_hor") : APP.t("house_na")}</div>
        </div>
        <div class="detail-item">
          <div class="k">${APP.t("profile_district")}</div>
          <div class="v">${APP.escapeHtml(m.district || APP.t("district_unspecified"))}</div>
        </div>
        <div class="detail-item">
          <div class="k">${APP.t("profile_phone")}</div>
          <div class="v">${phone ? `<a href="tel:+977${phone}" translate="no">${phone}</a>` : APP.t("phone_unavailable")}</div>
        </div>
        <div class="detail-item">
          <div class="k">${APP.t("profile_email")}</div>
          <div class="v">${email ? `<a href="mailto:${email}" translate="no">${email}</a>` : APP.t("email_unavailable")}</div>
        </div>
        <div class="detail-item">
          <div class="k">${APP.t("profile_id")}</div>
          <div class="v" translate="no">${m.id}</div>
        </div>
        <div class="detail-item">
          <div class="k">${APP.t("profile_party_code")}</div>
          <div class="v" translate="no">${m.party_code}</div>
        </div>
        ${committeeLinks}
      </div>

      <div class="profile-actions">
        ${phone ? `<a class="btn whatsapp-btn" id="waBtn" target="_blank" rel="noopener">${APP.ICONS.whatsapp}${APP.t("action_whatsapp")}</a>` : ""}
        <button class="btn primary" id="vcardBtn">${APP.ICONS.download}${APP.t("action_vcard")}</button>
        <button class="btn" id="copyBtn">${APP.ICONS.copy}${APP.t("action_copy")}</button>
        <button class="btn" id="shareBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>${APP.t("action_share")}</button>
        <button class="btn" id="printProfileBtn">${APP.ICONS.printer}${APP.t("action_print")}</button>
        <a class="btn" id="reportBtn" href="mailto:corrections@example.org?subject=${encodeURIComponent('Data correction: ' + (m.name_en || m.name_ne) + ' (' + m.id + ')')}">${APP.ICONS.info}${APP.t("action_report")}</a>
      </div>
    </div>
  `;
  document.querySelector(".profile-card").style.setProperty("--party-color", color);
  APP.announce(`${m.name_ne}`);

  if (phone) document.getElementById("waBtn").href = APP.whatsappLink(phone);
  document.getElementById("vcardBtn").addEventListener("click", () => {
    APP.downloadFile(`${(m.name_en || m.id).replace(/\s+/g, "_")}.vcf`, APP.vCard(m), "text/vcard");
  });
  document.getElementById("copyBtn").addEventListener("click", () => {
    const parts = [m.name_en || m.name_ne, phone, email].filter(Boolean);
    APP.copyText(parts.join(" · "), APP.t("contact_details"));
  });
  document.getElementById("shareBtn").addEventListener("click", async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: m.name_en || m.name_ne, url }); }
      catch (e) { /* user cancelled the native share sheet */ }
    } else {
      APP.copyText(url, APP.t("link_label"));
    }
  });
  document.getElementById("printProfileBtn").addEventListener("click", () => window.print());
})();

/* ---- Page bootstrap (was an inline <script> in member.html; moved here
   because the site's CSP is script-src 'self' with no 'unsafe-inline') ----
   Renders a "loading" placeholder subnav immediately; the IIFE above
   overwrites it with the real member name once members.json resolves. */
APP.renderHeader("directory.html");
APP.renderSubnav("loading", "directory.html", "nav_directory");
APP.renderFooter();
