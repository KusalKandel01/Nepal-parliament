/* ============================================================
   houses.js, powers the province seat-count map on houses.html.
   Data comes from assets/data/province_seats.json, which is
   computed directly from members.json (see pipeline notes in
   that file), not hand-typed, so it stays accurate if the
   roster changes.
   ============================================================ */
(function () {
  const TILE_ORDER = ["sudurpashchim", "karnali", "lumbini", "gandaki", "bagmati", "madhesh", "koshi"];
  // Row 0 = predominantly hill/mountain provinces; Row 1 = the two provinces
  // most associated with the Terai/plains belt. This is a simplified
  // schematic layout, not a geographically precise map.
  const ROW = { sudurpashchim: 1, karnali: 1, lumbini: 2, gandaki: 1, bagmati: 1, madhesh: 2, koshi: 1 };

  let DATA = null;
  let mode = "hor"; // "hor" | "na"

  function colorFor(seats, max) {
    // Interpolates between a light and a deep navy based on relative seat share.
    const t = Math.max(0.18, seats / max);
    const from = [190, 200, 214]; // light slate
    const to = [11, 26, 46]; // --navy
    const rgb = from.map((f, i) => Math.round(f + (to[i] - f) * t));
    return `rgb(${rgb.join(",")})`;
  }

  function render() {
    const mount = document.getElementById("provinceMap");
    const nominatedNote = document.getElementById("mapNominatedNote");
    if (!mount || !DATA) return;

    const provinces = DATA.provinces;
    const values = provinces.map(p => (mode === "hor" ? p.hor : p.na));
    const max = Math.max(...values);
    const lang = window.I18N_ENGINE ? window.I18N_ENGINE.getLang() : "ne";

    const sorted = TILE_ORDER.map(id => provinces.find(p => p.id === id)).filter(Boolean);

    mount.innerHTML = sorted.map(p => {
      const seats = mode === "hor" ? p.hor : p.na;
      const bg = colorFor(seats, max);
      const nameFirst = lang === "en" ? p.name_en : p.name_ne;
      const nameSecond = lang === "en" ? p.name_ne : p.name_en;
      const capital = lang === "en" ? p.capital_en : p.capital_ne;
      return `
        <div class="map-tile" data-row="${ROW[p.id]}" style="background:${bg}" title="${nameFirst}: ${seats}">
          <div class="p-name-ne">${nameFirst}</div>
          <div class="p-name-en">${nameSecond}</div>
          <div class="p-seats">${seats}</div>
          <div class="p-capital">${typeof APP !== "undefined" ? APP.t("houses_map_capital") : ""}: ${capital}</div>
        </div>`;
    }).join("");

    if (nominatedNote) {
      nominatedNote.style.display = mode === "na" ? "block" : "none";
      if (mode === "na" && typeof APP !== "undefined") {
        nominatedNote.textContent = `+${DATA.na_nominated} ${APP.t("houses_map_nominated")}`;
      }
    }
  }

  function initToggle() {
    const toggle = document.getElementById("mapToggle");
    if (!toggle) return;
    toggle.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        toggle.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === btn));
        render();
      });
    });
  }

  async function init() {
    try {
      DATA = await APP.loadJSON("province_seats.json");
    } catch (e) {
      const mount = document.getElementById("provinceMap");
      if (mount) mount.innerHTML = `<p class="panel-text-sm">Province data unavailable.</p>`;
      return;
    }
    initToggle();
    render();
  }

  init();
})();
