/* ============================================================
   official.js, powers official.html: loads a single government
   official or constitutional body by ?id= from
   government_sites.json (ministries / national_leadership /
   other_bodies), renders a profile card, and — where the person
   also holds a seat in Parliament (cross-checked by name against
   members.json, the same verified data behind the rest of the
   site) — links out to their full member.html profile with
   phone/email. Institutions (courts, commissions, the central
   bank) get a simpler profile without a person/avatar framing,
   since they aren't held by one named individual.
   ============================================================ */

(async function () {
  const mount = document.getElementById("profileMount");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const lang = APP.getLang();

  if (!id) {
    mount.innerHTML = `<div class="panel"><p>${APP.t("official_no_id")}</p></div>`;
    APP.announce(APP.t("official_no_id"));
    return;
  }

  let govData, memberData;
  try {
    [govData, memberData] = await Promise.all([
      APP.loadJSON("government_sites.json"),
      APP.loadJSON("members.json"),
    ]);
  } catch (e) {
    mount.innerHTML = `<div class="panel"><p>${APP.t("official_load_failed")} <a href="official.html?id=${APP.escapeHtml(id)}">${APP.t("retry")}</a>.</p></div>`;
    APP.announce(APP.t("official_load_failed"));
    return;
  }

  const pools = [
    ...(govData.national_leadership || []).map((x) => ({ ...x, kind: "leader" })),
    ...(govData.ministries || []).map((x) => ({ ...x, kind: "ministry" })),
    ...(govData.other_bodies || []).map((x) => ({ ...x, kind: "other" })),
  ];
  const item = pools.find((x) => x.id === id);

  if (!item) {
    mount.innerHTML = `<div class="panel"><p>${APP.t("official_not_found")} <strong translate="no">${APP.escapeHtml(id)}</strong></p><p><a href="government.html">${APP.t("view_full_government")}</a></p></div>`;
    APP.announce(APP.t("official_not_found"));
    return;
  }

  /* ---- Cross-link to a sitting MP, if this officeholder is one. Matched
     by English name (unambiguous single Latin spelling on both sides,
     unlike Devanagari where the same name has multiple valid spellings —
     see members.json's minister_ne vs. this file's spelling for
     "Balendra Shah" as a real example). A couple of known transliteration
     variants (e.g. "Pokharel"/"Pokhrel") are aliased by hand below, each
     verified against district + party before being added, not guessed. ---- */
  const MP_NAME_ALIAS = {
    "sasmit pokharel": "sasmit pokhrel",
    "gauri kumari yadav": "gauri kumari",
  };
  const mpIndex = {};
  memberData.members.forEach((m) => {
    if (m.name_en) mpIndex[m.name_en.trim().toLowerCase()] = m;
  });
  let linkedMp = null;
  if (item.minister) {
    const key = item.minister.trim().toLowerCase();
    linkedMp = mpIndex[key] || mpIndex[MP_NAME_ALIAS[key]] || null;
  }

  const name = lang === "en" ? item.name_en : item.name_ne;
  const fn = lang === "en" ? item.function_en : item.function_ne;
  const extra = lang === "en" ? item.extra : (item.extra_ne || item.extra);
  const roleLabelKey = item.kind === "ministry" ? "official_role_ministry" : item.kind === "leader" ? "official_role_leader" : "official_role_institution";

  const siteBlock = item.url
    ? `<a class="btn primary" href="${item.url}" target="_blank" rel="noopener noreferrer" translate="no">${APP.ICONS.flag}${APP.t("gov_visit_site")}: ${item.url.replace(/^https?:\/\//, "")}</a>`
    : "";

  /* ---- SEO ---- */
  const siteSuffix = lang === "en" ? "Federal Parliament Contact Directory" : "संघीय संसद सम्पर्क निर्देशिका";
  const holderName = item.minister ? (lang === "en" ? item.minister : (item.minister_ne || item.minister)) : name;
  document.title = `${holderName} | ${siteSuffix}`;
  document.getElementById("pageTitle").textContent = document.title;
  APP.renderSubnav(holderName, "government.html", "nav_government");
  document.getElementById("pageDescription").setAttribute("content", `${holderName} — ${name}. ${fn}`);
  document.getElementById("ogTitle").setAttribute("content", document.title);
  document.getElementById("pageCanonical").setAttribute("href", `https://nepal-parliament-directory.vercel.app/${lang}/official.html?id=${encodeURIComponent(item.id)}`);

  if (item.minister) {
    /* ---------------- Person profile (minister / national leadership) ---------------- */
    const initial = holderName.trim().charAt(0);
    const mpPhoto = linkedMp && linkedMp.photo;
    const avatarInner = mpPhoto
      ? `<img src="${mpPhoto}" alt="" width="96" height="96" data-fallback-initial="${APP.escapeHtml(initial)}">`
      : `<span translate="no">${APP.escapeHtml(initial)}</span>`;
    const color = linkedMp ? APP.partyColorVar(linkedMp.party_code) : "--gold";

    const mpPanel = linkedMp ? `
      <div class="panel" style="margin-top:20px; border-left:3px solid var(${color});">
        <h2 style="font-size:1rem; margin:0 0 6px;">${APP.t("official_also_mp_heading")}</h2>
        <p class="panel-text-sm" style="margin:0 0 14px;">${APP.t("official_also_mp_note")}</p>
        <div class="flex-gap-md" style="flex-wrap:wrap; align-items:center;">
          <span class="role-pill">${APP.escapeHtml(APP.partyLabelFor(linkedMp.party_code, linkedMp.party_ne) || "")}</span>
          <span>${APP.escapeHtml(APP.districtLabelFor(linkedMp.district) || APP.t("district_unspecified"))}</span>
          <a class="tool-card-cta" href="member.html?id=${linkedMp.id}">${APP.t("official_view_mp_profile")}</a>
        </div>
      </div>` : "";

    mount.innerHTML = `
      <div class="profile-card party-accent" style="--party-color:var(${color});">
        <div class="profile-top">
          <div class="profile-avatar">${avatarInner}</div>
          <div>
            <span class="role-pill">${APP.t(roleLabelKey)}</span>
            <h1 class="profile-name">${APP.escapeHtml(holderName)}</h1>
            <span class="profile-party">${APP.escapeHtml(name)}</span>
          </div>
        </div>
        <div class="profile-details">
          <div class="detail-item detail-item-wide">
            <div class="k">${APP.t("gov_function_label")}</div>
            <div class="v">${APP.escapeHtml(fn)}</div>
          </div>
          ${extra ? `<div class="detail-item detail-item-wide"><div class="k">${APP.t("gov_extra_label")}</div><div class="v">${APP.escapeHtml(extra)}</div></div>` : ""}
        </div>
        <div class="profile-actions">
          ${siteBlock}
          <button class="btn" id="shareBtn">${APP.t("action_share")}</button>
          <button class="btn" id="printProfileBtn">${APP.ICONS.printer}${APP.t("action_print")}</button>
        </div>
      </div>
      ${mpPanel}
    `;
  } else {
    /* ---------------- Institution profile (constitutional body, no single named holder) ---------------- */
    mount.innerHTML = `
      <div class="profile-card">
        <div class="profile-top">
          <div class="profile-avatar" aria-hidden="true">${APP.ICONS.flag}</div>
          <div>
            <span class="role-pill">${APP.t(roleLabelKey)}</span>
            <h1 class="profile-name">${APP.escapeHtml(name)}</h1>
          </div>
        </div>
        <div class="profile-details">
          <div class="detail-item detail-item-wide">
            <div class="k">${APP.t("gov_function_label")}</div>
            <div class="v">${APP.escapeHtml(fn)}</div>
          </div>
          ${extra ? `<div class="detail-item detail-item-wide"><div class="k">${APP.t("gov_extra_label")}</div><div class="v">${APP.escapeHtml(extra)}</div></div>` : ""}
        </div>
        <div class="profile-actions">
          ${siteBlock}
          <button class="btn" id="shareBtn">${APP.t("action_share")}</button>
          <button class="btn" id="printProfileBtn">${APP.ICONS.printer}${APP.t("action_print")}</button>
        </div>
      </div>
    `;
  }

  APP.announce(holderName);
  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const url = window.location.href;
      if (navigator.share) {
        try { await navigator.share({ title: holderName, url }); } catch (e) { /* cancelled */ }
      } else {
        APP.copyText(url, APP.t("link_label"));
      }
    });
  }
  const printBtn = document.getElementById("printProfileBtn");
  if (printBtn) printBtn.addEventListener("click", () => window.print());
})();

/* ---- Page bootstrap (CSP is script-src 'self' with no 'unsafe-inline') ---- */
APP.renderHeader("government.html");
APP.renderSubnav("loading", "government.html", "nav_government");
APP.renderFooter();
