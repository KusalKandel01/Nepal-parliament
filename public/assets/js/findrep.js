/* ============================================================
   findrep.js, powers find-representative.html: lets a person
   pick their province and district and see the House of
   Representatives member(s) for that district plus the National
   Assembly members for that province. Uses only the same
   verified members.json data as the rest of the directory, via
   APP.provinceForDistrict() / APP.DISTRICT_TO_PROVINCE (app.js).
   ============================================================ */

(async function () {
  const lang = APP.getLang();
  const provinceMount = document.getElementById("provincePicker");
  const districtSelect = document.getElementById("districtSelect");
  const resultsMount = document.getElementById("findrepResults");

  let membersData, provinceData;
  try {
    [membersData, provinceData] = await Promise.all([
      APP.loadJSON("members.json"),
      APP.loadJSON("province_seats.json"),
    ]);
  } catch (e) {
    resultsMount.innerHTML = `<div class="panel"><p>${APP.t("member_load_failed")}</p></div>`;
    APP.announce(APP.t("member_load_failed"));
    return;
  }

  const members = membersData.members;
  const provinces = provinceData.provinces;

  // Group every district in DISTRICT_TO_PROVINCE (app.js) by its province,
  // sorted by displayed label so the <select> reads alphabetically.
  const districtsByProvince = {};
  Object.keys(APP.DISTRICT_TO_PROVINCE).forEach((d) => {
    const p = APP.DISTRICT_TO_PROVINCE[d];
    (districtsByProvince[p] = districtsByProvince[p] || []).push(d);
  });
  Object.keys(districtsByProvince).forEach((p) => {
    districtsByProvince[p].sort((a, b) =>
      APP.districtLabelFor(a).localeCompare(APP.districtLabelFor(b), lang === "en" ? "en" : "ne")
    );
  });

  let selectedProvince = null;
  let selectedDistrict = null;

  function miniCardHTML(m) {
    const color = APP.partyColorVar(m.party_code);
    const initial = lang === "en"
      ? (m.name_en || m.name_ne || "?").trim().charAt(0)
      : (m.name_ne || "?").replace(/^मा\.\s*/, "").replace(/^डा\.\s*/, "").trim().charAt(0);
    const avatarInner = m.photo
      ? `<img src="${m.photo}" alt="" width="52" height="52" loading="lazy" data-fallback-initial="${APP.escapeHtml(initial)}">`
      : `<span translate="no">${initial}</span>`;
    const phone = m.phones && m.phones[0];
    const email = m.emails && m.emails[0];
    const primaryName = lang === "en" ? (m.name_en || m.name_ne) : m.name_ne;

    return `
      <article class="member-card" style="--party-color:${color}" data-id="${m.id}">
        <span class="badge-house">${m.house === "HoR" ? "HoR" : "NA"} · ${m.id.replace("MP", "#")}</span>
        <div class="card-top">
          <div class="avatar">${avatarInner}</div>
          <div class="card-body">
            ${m.role ? `<span class="role-pill">${APP.escapeHtml(m.role)}</span>` : ""}
            <h3 class="card-name">${APP.escapeHtml(primaryName)}</h3>
            <span class="card-party">${APP.escapeHtml(APP.partyLabelFor(m.party_code, m.party_ne) || "N/A")}</span>
          </div>
        </div>
        <div class="card-meta">
          <div class="meta-row">${APP.ICONS.pin}<span>${APP.escapeHtml(APP.districtLabelFor(m.district) || APP.t("district_unspecified"))}</span></div>
          ${phone
            ? `<div class="meta-row">${APP.ICONS.phone}<a class="link" href="tel:+977${phone}" translate="no">${phone}</a></div>`
            : `<div class="meta-row empty">${APP.t("phone_unavailable")}</div>`}
          ${email
            ? `<div class="meta-row">${APP.ICONS.email}<a class="link" href="mailto:${email}" translate="no">${email}</a></div>`
            : `<div class="meta-row empty">${APP.t("email_unavailable")}</div>`}
        </div>
        <div class="card-actions">
          <a class="action-btn" href="member.html?id=${m.id}">${APP.ICONS.info}<span class="tooltip">${APP.t("tooltip_profile")}</span></a>
        </div>
      </article>`;
  }

  function renderProvincePicker() {
    provinceMount.innerHTML = provinces
      .map((p) => `
        <button type="button" class="province-btn${p.id === selectedProvince ? " active" : ""}"
          data-province="${p.id}" aria-pressed="${p.id === selectedProvince}">
          ${APP.escapeHtml(lang === "en" ? p.name_en : p.name_ne)}
        </button>`)
      .join("");
    provinceMount.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedProvince = btn.dataset.province;
        selectedDistrict = null;
        renderProvincePicker();
        renderDistrictSelect();
        renderResults();
      });
    });
  }

  function renderDistrictSelect() {
    if (!selectedProvince) {
      districtSelect.disabled = true;
      districtSelect.innerHTML = `<option value="">${APP.t("findrep_district_placeholder")}</option>`;
      return;
    }
    districtSelect.disabled = false;
    const list = districtsByProvince[selectedProvince] || [];
    districtSelect.innerHTML =
      `<option value="">${APP.t("findrep_district_placeholder")}</option>` +
      list.map((d) => `<option value="${APP.escapeHtml(d)}">${APP.escapeHtml(APP.districtLabelFor(d))}</option>`).join("");
  }

  districtSelect.addEventListener("change", () => {
    selectedDistrict = districtSelect.value || null;
    renderResults();
  });

  function renderResults() {
    if (!selectedProvince) {
      resultsMount.innerHTML = `<div class="findrep-prompt">${APP.t("findrep_start_prompt")}</div>`;
      return;
    }
    let html = "";

    if (selectedDistrict) {
      const horMembers = members.filter((m) => m.house === "HoR" && m.district === selectedDistrict);
      html += `<div class="findrep-result-section"><h2>${APP.t("findrep_hor_heading")}</h2>`;
      html += horMembers.length
        ? `<div class="grid-2col-min260">${horMembers.map(miniCardHTML).join("")}</div>`
        : `<p class="findrep-result-note">${APP.t("findrep_hor_none")}</p>`;
      html += `</div>`;
    }

    const naMembers = members.filter(
      (m) => m.house === "NA" && APP.provinceForDistrict(m.district) === selectedProvince
    );
    html += `<div class="findrep-result-section"><h2>${APP.t("findrep_na_heading")}</h2>`;
    html += `<p class="findrep-result-note">${APP.t("findrep_na_note")}</p>`;
    html += naMembers.length
      ? `<div class="grid-2col-min260">${naMembers.map(miniCardHTML).join("")}</div>`
      : `<p class="findrep-result-note">${APP.t("findrep_na_none")}</p>`;
    html += `</div>`;

    resultsMount.innerHTML = html;
  }

  renderProvincePicker();
  renderDistrictSelect();
  renderResults();
})();

/* ---- Page bootstrap (see filters.js for why this isn't inline: CSP is
   script-src 'self' with no 'unsafe-inline') ---- */
APP.renderHeader("find-representative.html");
APP.renderSubnav("tool_findrep_title", "tools.html", "nav_tools");
APP.renderFooter();
APP.initScrollTop();
