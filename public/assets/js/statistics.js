/* ============================================================
   statistics.js — powers statistics.html: donut/column/bar SVG
   charts driven by statistics.json. Party colors are resolved
   once via APP.resolvePartyColor (single source of truth shared
   with filters.js/style.css) rather than a locally duplicated map.
   ============================================================ */

(async function () {
  const main = document.getElementById("main");
  let stats;
  try {
    stats = await APP.loadJSON("statistics.json");
  } catch (e) {
    document.getElementById("partyDonut").parentElement.parentElement.innerHTML =
      `<div class="no-results"><p>तथ्याङ्क लोड गर्न असफल भयो। पृष्ठ पुनः लोड गर्नुहोस्।</p></div>`;
    APP.announce("तथ्याङ्क लोड गर्न असफल भयो");
    return;
  }

  document.getElementById("statsBar").innerHTML = `
    <div class="stat-item"><div class="num">${stats.total_members}</div><div class="label">कुल सदस्य</div></div>
    <div class="stat-item"><div class="num">${stats.by_house.HoR}</div><div class="label">प्रतिनिधि सभा</div></div>
    <div class="stat-item"><div class="num">${stats.by_house.NA}</div><div class="label">राष्ट्रिय सभा</div></div>
    <div class="stat-item"><div class="num">${Object.keys(stats.by_party).length}</div><div class="label">राजनीतिक दलहरू</div></div>
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
      <span class="legend-label">${stats.party_labels[code] || code} <span class="code">(${code})</span></span>
      <strong>${val}</strong>
    </div>
  `).join("");

  CHARTS.columnChart(document.getElementById("houseColumns"), [
    { label: "प्रतिनिधि सभा", value: stats.by_house.HoR, color: APP.resolvePartyColor("RSP") },
    { label: "राष्ट्रिय सभा", value: stats.by_house.NA, color: getComputedStyle(document.documentElement).getPropertyValue("--gold").trim() },
  ], { width: 320, height: 200 });

  const districtRows = Object.entries(stats.top_districts).map(([d, v]) => ({
    label: d, value: v, color: getComputedStyle(document.documentElement).getPropertyValue("--gold").trim()
  }));
  CHARTS.barList(document.getElementById("districtBars"), districtRows);

  const rootStyles = getComputedStyle(document.documentElement);
  const c = stats.data_completeness;
  CHARTS.barList(document.getElementById("completenessBars"), [
    { label: "फोन उपलब्ध", value: c.with_phone, color: APP.resolvePartyColor("NC") },
    { label: "फोन अनुपलब्ध", value: c.without_phone, color: rootStyles.getPropertyValue("--crimson").trim() },
    { label: "इमेल उपलब्ध", value: c.with_email, color: APP.resolvePartyColor("RSP") },
    { label: "फोटो उपलब्ध", value: c.with_photo, color: rootStyles.getPropertyValue("--gold").trim() },
  ]);

  const missingPhoneNote = document.getElementById("missingPhoneNote");
  if (missingPhoneNote && c.without_phone) {
    missingPhoneNote.textContent = `${c.without_phone} सदस्यको फोन नम्बर स्रोत डाइरेक्ट्रीमा नै उपलब्ध थिएन (अनुमान गरिएको छैन)।`;
  }

  APP.announce("तथ्याङ्क चार्ट लोड भयो");
})();
