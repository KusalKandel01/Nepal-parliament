/* ============================================================
   compare.js, powers compare.html: search-and-add up to 3
   members, then render their party/house/district/contact
   details side by side in a table. Uses the same verified
   members.json data as the rest of the directory.
   ============================================================ */

(async function () {
  const lang = APP.getLang();
  const MAX = 3;
  const input = document.getElementById("compareSearchInput");
  const suggestBox = document.getElementById("compareSuggestions");
  const addedRow = document.getElementById("compareAddedRow");
  const tableMount = document.getElementById("compareTableMount");

  let members = [];
  try {
    const data = await APP.loadJSON("members.json");
    members = data.members;
  } catch (e) {
    tableMount.innerHTML = `<div class="panel"><p>${APP.t("member_load_failed")}</p></div>`;
    APP.announce(APP.t("member_load_failed"));
    return;
  }

  let selected = [];

  function nameFor(m) {
    return lang === "en" ? (m.name_en || m.name_ne) : m.name_ne;
  }
  function initialFor(m) {
    return lang === "en"
      ? (m.name_en || m.name_ne || "?").trim().charAt(0)
      : (m.name_ne || "?").replace(/^मा\.\s*/, "").replace(/^डा\.\s*/, "").trim().charAt(0);
  }

  function renderSuggestions(query) {
    const q = query.trim().toLowerCase();
    if (!q) { suggestBox.innerHTML = ""; suggestBox.hidden = true; return; }
    const selectedIds = new Set(selected.map((m) => m.id));
    const matches = members
      .filter((m) => !selectedIds.has(m.id))
      .filter((m) => {
        const hay = [m.name_ne, m.name_en, m.district, m.party_ne, m.party_code]
          .filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 6);

    if (!matches.length) {
      suggestBox.innerHTML = `<div class="suggest-empty">${APP.t("suggest_no_match")}</div>`;
      suggestBox.hidden = false;
      return;
    }

    suggestBox.innerHTML = matches.map((m) => `
      <button type="button" class="suggest-item" data-id="${m.id}" style="width:100%; text-align:left; border:none; background:transparent; cursor:pointer;">
        <span class="suggest-avatar" style="background:${APP.partyColorVar(m.party_code)}" translate="no">${APP.escapeHtml(initialFor(m))}</span>
        <span class="suggest-text">
          <span class="suggest-name">${APP.highlight(nameFor(m), query)}</span>
          <span class="suggest-meta">${APP.escapeHtml(APP.districtLabelFor(m.district) || APP.t("district_unspecified"))} · ${APP.escapeHtml(APP.partyLabelFor(m.party_code, m.party_ne) || "")}</span>
        </span>
      </button>
    `).join("");
    suggestBox.hidden = false;

    suggestBox.querySelectorAll(".suggest-item").forEach((btn) => {
      btn.addEventListener("click", () => addMember(btn.dataset.id));
    });
  }

  function addMember(id) {
    if (selected.some((m) => m.id === id)) { APP.toast(APP.t("compare_already_added")); return; }
    if (selected.length >= MAX) { APP.toast(APP.t("compare_max_reached")); return; }
    const m = members.find((x) => x.id === id);
    if (!m) return;
    selected.push(m);
    input.value = "";
    suggestBox.innerHTML = "";
    suggestBox.hidden = true;
    renderAll();
  }

  function removeMember(id) {
    selected = selected.filter((m) => m.id !== id);
    renderAll();
  }

  function renderChips() {
    addedRow.innerHTML = selected.map((m) => `
      <span class="compare-chip">
        <span class="chip-avatar" style="background:${APP.partyColorVar(m.party_code)}" translate="no">${APP.escapeHtml(initialFor(m))}</span>
        ${APP.escapeHtml(nameFor(m))}
        <button type="button" aria-label="${APP.t("compare_remove")}" data-id="${m.id}">${APP.ICONS.close || "×"}</button>
      </span>
    `).join("");
    addedRow.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => removeMember(btn.dataset.id));
    });
  }

  function colAvatarHTML(m) {
    const initial = initialFor(m);
    return m.photo
      ? `<div class="compare-col-avatar" style="background:${APP.partyColorVar(m.party_code)}"><img src="${m.photo}" alt="" loading="lazy" data-fallback-initial="${APP.escapeHtml(initial)}"></div>`
      : `<div class="compare-col-avatar" style="background:${APP.partyColorVar(m.party_code)}" translate="no">${APP.escapeHtml(initial)}</div>`;
  }

  function renderTable() {
    if (selected.length < 2) {
      tableMount.innerHTML = `
        <div class="findrep-prompt">
          <p style="margin:0 0 4px; font-weight:600;">${APP.t("compare_empty_title")}</p>
          <p style="margin:0; font-size:0.86rem;">${APP.t("compare_empty_sub")}</p>
        </div>`;
      return;
    }
    const rows = [
      { label: APP.t("profile_house"), get: (m) => (m.house === "HoR" ? APP.t("house_hor") : APP.t("house_na")) },
      { label: APP.t("th_party"), get: (m) => APP.escapeHtml(APP.partyLabelFor(m.party_code, m.party_ne) || "N/A") },
      { label: APP.t("profile_district"), get: (m) => APP.escapeHtml(APP.districtLabelFor(m.district) || APP.t("district_unspecified")) },
      { label: APP.t("compare_row_role"), get: (m) => (m.role ? APP.escapeHtml(m.role) : APP.t("compare_row_role_none")) },
      { label: APP.t("profile_phone"), get: (m) => (m.phones && m.phones[0] ? `<a href="tel:+977${m.phones[0]}" translate="no">${m.phones[0]}</a>` : APP.t("phone_unavailable")) },
      { label: APP.t("profile_email"), get: (m) => (m.emails && m.emails[0] ? `<a href="mailto:${m.emails[0]}" translate="no">${m.emails[0]}</a>` : APP.t("email_unavailable")) },
      { label: APP.t("profile_id"), get: (m) => `<span translate="no">${m.id}</span>` },
    ];

    const head = `
      <thead><tr>
        <th></th>
        ${selected.map((m) => `
          <th class="compare-col-head">
            ${colAvatarHTML(m)}
            <div class="compare-col-name">${APP.escapeHtml(nameFor(m))}</div>
            <a class="tool-card-cta" href="member.html?id=${m.id}">${APP.t("compare_view_profile")}</a>
          </th>`).join("")}
      </tr></thead>`;

    const body = `
      <tbody>
        ${rows.map((r) => `
          <tr>
            <th scope="row">${r.label}</th>
            ${selected.map((m) => `<td>${r.get(m)}</td>`).join("")}
          </tr>`).join("")}
      </tbody>`;

    tableMount.innerHTML = `<div class="panel table-scroll"><table class="compare-table">${head}${body}</table></div>`;
  }

  function renderAll() {
    renderChips();
    renderTable();
  }

  const debounced = APP.debounce(() => renderSuggestions(input.value), 200);
  input.addEventListener("input", debounced);
  input.addEventListener("focus", () => { if (input.value.trim()) renderSuggestions(input.value); });
  document.addEventListener("click", (e) => {
    if (!suggestBox.contains(e.target) && e.target !== input) {
      suggestBox.hidden = true;
    }
  });

  renderAll();
})();

/* ---- Page bootstrap (see filters.js for why this isn't inline: CSP is
   script-src 'self' with no 'unsafe-inline') ---- */
APP.renderHeader("compare.html");
APP.renderSubnav("tool_compare_title", "tools.html", "nav_tools");
APP.renderFooter();
APP.initScrollTop();
