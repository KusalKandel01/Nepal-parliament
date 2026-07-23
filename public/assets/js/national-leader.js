/* ============================================================
   national-leader.js, powers national-leader.html: loads a
   single national-leadership entry (President, Vice President,
   Chief Justice — offices that aren't also MPs, so they don't
   have a member.html profile) by ?id= from government_sites.json,
   and renders a profile card in the same visual language as
   member.js's MP profiles.
   ============================================================ */

(async function () {
  const mount = document.getElementById("profileMount");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const lang = APP.getLang();

  if (!id) {
    mount.innerHTML = `<div class="panel"><p>${APP.t("leader_profile_not_found")}</p></div>`;
    APP.announce(APP.t("leader_profile_not_found"));
    return;
  }

  let govData;
  try {
    govData = await APP.loadJSON("government_sites.json");
  } catch (e) {
    mount.innerHTML = `<div class="panel"><p>${APP.t("member_load_failed")}</p></div>`;
    APP.announce(APP.t("member_load_failed"));
    return;
  }

  const o = (govData.national_leadership || []).find((x) => x.id === id);
  if (!o) {
    mount.innerHTML = `<div class="panel"><p>${APP.t("leader_profile_not_found")}</p><p><a href="government.html">${APP.t("leader_profile_view_ministries")}</a></p></div>`;
    APP.announce(APP.t("leader_profile_not_found"));
    return;
  }

  const officeName = lang === "en" ? o.name_en : o.name_ne;
  const holderName = lang === "en" ? o.minister : (o.minister_ne || o.minister);
  const fn = lang === "en" ? o.function_en : o.function_ne;
  const extra = lang === "en" ? o.extra : (o.extra_ne || o.extra);

  /* ---- Dynamic SEO ---- */
  const siteSuffix = lang === "en" ? "Federal Parliament Contact Directory" : "संघीय संसद सम्पर्क निर्देशिका";
  document.title = `${holderName} — ${officeName} | ${siteSuffix}`;
  document.getElementById("pageTitle").textContent = document.title;
  APP.renderSubnav(officeName, "government.html", "nav_government");
  const desc = lang === "en"
    ? `${holderName}, ${officeName} of Nepal. ${fn}`
    : `${holderName}, ${officeName}। ${fn}`;
  document.getElementById("pageDescription").setAttribute("content", desc);
  document.getElementById("ogTitle").setAttribute("content", document.title);
  document.getElementById("ogDescription").setAttribute("content", desc);
  document.getElementById("pageCanonical").setAttribute("href", `https://nepal-parliament-directory.vercel.app/${lang}/national-leader.html?id=${encodeURIComponent(o.id)}`);

  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": holderName,
    "jobTitle": o.name_en,
    "worksFor": { "@type": "GovernmentOrganization", "name": "Government of Nepal" },
    "url": o.url || undefined,
  });
  document.head.appendChild(ld);

  /* ---- Render ---- */
  const initial = (holderName || "?").trim().charAt(0);
  const avatarWrap = `<div class="profile-avatar"><span translate="no">${APP.escapeHtml(initial)}</span></div>`;

  mount.innerHTML = `
    <div class="profile-card">
      <div class="profile-top">
        ${avatarWrap}
        <div>
          <span class="role-pill">${APP.escapeHtml(officeName)}</span>
          <h1 class="profile-name" translate="no">${APP.escapeHtml(holderName)}</h1>
        </div>
      </div>

      <div class="profile-details">
        <div class="detail-item detail-item-wide">
          <div class="k">${APP.t("leader_profile_about")}</div>
          <div class="v">${APP.escapeHtml(fn)}</div>
        </div>
        ${extra ? `
        <div class="detail-item detail-item-wide">
          <div class="k">${APP.t("leader_profile_office_since")}</div>
          <div class="v">${APP.escapeHtml(extra)}</div>
        </div>` : ""}
        <div class="detail-item detail-item-wide">
          <div class="k">${APP.t("leader_profile_note_label")}</div>
          <div class="v">${APP.t("leader_profile_contact_note")}</div>
        </div>
      </div>

      <div class="profile-actions">
        ${o.url ? `<a class="btn primary" href="${o.url}" target="_blank" rel="noopener noreferrer" translate="no">${APP.ICONS.flag}${APP.t("leader_profile_official_site")}: ${o.url.replace(/^https?:\/\//, "")}</a>` : ""}
        <button class="btn" id="copyBtn">${APP.ICONS.copy}${APP.t("action_copy")}</button>
        <button class="btn" id="shareBtn"><svg aria-hidden="true" fill="none" focusable="false" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>${APP.t("action_share")}</button>
        <button class="btn" id="printProfileBtn">${APP.ICONS.printer}${APP.t("action_print")}</button>
        <a class="btn" href="government.html">${APP.t("leader_profile_view_ministries")}</a>
      </div>
    </div>
  `;
  APP.announce(holderName);

  document.getElementById("copyBtn").addEventListener("click", () => {
    APP.copyText([holderName, officeName].filter(Boolean).join(" · "), APP.t("contact_details"));
  });
  document.getElementById("shareBtn").addEventListener("click", async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: holderName, url }); }
      catch (e) { /* user cancelled the native share sheet */ }
    } else {
      APP.copyText(url, APP.t("link_label"));
    }
  });
  document.getElementById("printProfileBtn").addEventListener("click", () => window.print());
})();

/* ---- Page bootstrap (CSP is script-src 'self' with no 'unsafe-inline') ---- */
APP.renderHeader("government.html");
APP.renderSubnav("loading", "government.html", "nav_government");
APP.renderFooter();
