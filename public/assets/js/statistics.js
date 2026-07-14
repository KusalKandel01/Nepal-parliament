/* ============================================================
   statistics.js — powers statistics.html: donut/column/bar SVG
   charts driven by statistics.json. Party colors are resolved
   once via APP.resolvePartyColor (single source of truth shared
   with filters.js/style.css) rather than a locally duplicated map.
   ============================================================ */

(async function () {
  let stats;
  try {
    stats = await APP.loadJSON("statistics.json");
  } catch (e) {
    document.getElementById("partyDonut").parentElement.parentElement.innerHTML =
      `<div class="no-results"><p>${APP.t("stats_load_failed")}</p></div>`;
    APP.announce(APP.t("stats_load_failed"));
    return;
  }

  document.getElementById("statsBar").innerHTML = `
    <div class="stat-item"><div class="num">${stats.total_members}</div><div class="label">${APP.t("stat_total")}</div></div>
    <div class="stat-item"><div class="num">${stats.by_house.HoR}</div><div class="label">${APP.t("stat_hor")}</div></div>
    <div class="stat-item"><div class="num">${stats.by_house.NA}</div><div class="label">${APP.t("stat_na")}</div></div>
    <div class="stat-item"><div class="num">${Object.keys(stats.by_party).length}</div><div class="label">${APP.t("stat_parties")}</div></div>
  `;

  const partyEntries = Object.entries(stats.by_party).sort((a, b) => b[1] - a[1]);
  const segments = partyEntries.map(([code, val]) => ({
    label: `${stats.party_labels[code] || code} (${code})`,
    value: val,
    color: APP.resolvePartyColor(code)
  }));
  CHARTS.donut(document.getElementById("partyDonut"), segments, { size: 200 });

  document.getElementById("partyLegend").innerHTML = partyEntries.map(([code, val]) => `
    <div class="legend-row">
      <span class="legend-swatch" style="background:${APP.resolvePartyColor(code)}"></span>
      <span class="legend-label">${stats.party_labels[code] || code} <span class="code" translate="no">(${code})</span></span>
      <strong>${val}</strong>
    </div>
  `).join("");

  const rootStyles = getComputedStyle(document.documentElement);
  CHARTS.columnChart(document.getElementById("houseColumns"), [
    { label: APP.t("house_hor"), value: stats.by_house.HoR, color: APP.resolvePartyColor("RSP") },
    { label: APP.t("house_na"), value: stats.by_house.NA, color: rootStyles.getPropertyValue("--gold").trim() },
  ], { width: 320, height: 200 });

  const districtRows = Object.entries(stats.top_districts).map(([d, v]) => ({
    label: d, value: v, color: rootStyles.getPropertyValue("--gold").trim()
  }));
  CHARTS.barList(document.getElementById("districtBars"), districtRows);

  const c = stats.data_completeness;
  CHARTS.barList(document.getElementById("completenessBars"), [
    { label: APP.t("completeness_phone_available"), value: c.with_phone, color: APP.resolvePartyColor("NC") },
    { label: APP.t("completeness_phone_missing"), value: c.without_phone, color: rootStyles.getPropertyValue("--crimson").trim() },
    { label: APP.t("completeness_email_available"), value: c.with_email, color: APP.resolvePartyColor("RSP") },
    { label: APP.t("completeness_photo_available"), value: c.with_photo, color: rootStyles.getPropertyValue("--gold").trim() },
  ]);

  const missingPhoneNote = document.getElementById("missingPhoneNote");
  if (missingPhoneNote && c.without_phone) {
    missingPhoneNote.textContent = `${c.without_phone} ${APP.t("missing_phone_note")}`;
  }

  APP.announce(APP.t("chart_party_title"));
})();
