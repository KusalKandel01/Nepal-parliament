/* ============================================================
   houses.js, powers the province seat-count map on houses.html.
   Seat counts come from assets/data/province_seats.json, computed
   directly from members.json. District boundary geometry comes
   from assets/data/nepal_districts.json, adapted from the
   nepal-district-map npm package by Niraj Pal (MIT License,
   https://npm.im/nepal-district-map); the 77 district shapes are
   grouped by province to draw a real, proportionate map instead
   of a schematic tile grid.
   ============================================================ */
(function () {
  const PROVINCE_COLORS = {
    koshi: { fill: "#7A2331", stroke: "#5C1A25" },
    madhesh: { fill: "#8F7420", stroke: "#6E5A18" },
    bagmati: { fill: "#2A3F73", stroke: "#1E2E56" },
    gandaki: { fill: "#3D6B4F", stroke: "#2C4E3A" },
    lumbini: { fill: "#6B4C7A", stroke: "#4E375A" },
    karnali: { fill: "#A65A2E", stroke: "#7D4322" },
    sudurpashchim: { fill: "#2E7A76", stroke: "#215A57" },
  };

  let SEATS = null;
  let GEO = null;
  let mode = "hor"; // "hor" | "na"
  let activeProvince = null;

  function lang() { return window.I18N_ENGINE ? window.I18N_ENGINE.getLang() : "ne"; }

  function provinceInfo(id) {
    return SEATS.provinces.find(p => p.id === id);
  }

  function renderLegend() {
    const legend = document.getElementById("mapLegend");
    if (!legend) return;
    const L = lang();
    const values = SEATS.provinces.map(p => (mode === "hor" ? p.hor : p.na));
    const max = Math.max(...values);
    legend.innerHTML = SEATS.provinces.map(p => {
      const seats = mode === "hor" ? p.hor : p.na;
      const color = PROVINCE_COLORS[p.id] || { fill: "#8F7420" };
      const name = L === "en" ? p.name_en : p.name_ne;
      const isActive = activeProvince === p.id;
      const pct = Math.max(6, Math.round((seats / max) * 100));
      return `
        <button type="button" class="legend-row${isActive ? " active" : ""}" data-province="${p.id}">
          <span class="legend-swatch" style="background:${color.fill}"></span>
          <span class="legend-name">${APP.escapeHtml(name)}</span>
          <span class="legend-bar-track"><span class="legend-bar-fill" style="width:${pct}%;background:${color.fill}"></span></span>
          <span class="legend-seats">${seats}</span>
        </button>`;
    }).join("");
    legend.querySelectorAll(".legend-row").forEach(btn => {
      btn.addEventListener("mouseenter", () => setActive(btn.dataset.province));
      btn.addEventListener("mouseleave", () => setActive(null));
      btn.addEventListener("click", () => setActive(activeProvince === btn.dataset.province ? null : btn.dataset.province));
    });
  }

  function setActive(provinceId) {
    activeProvince = provinceId;
    const mount = document.getElementById("provinceMap");
    if (mount) {
      mount.querySelectorAll("path[data-province]").forEach(el => {
        const isActive = !activeProvince || el.dataset.province === activeProvince;
        el.style.opacity = isActive ? "1" : "0.35";
      });
    }
    document.querySelectorAll(".legend-row").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.province === activeProvince);
    });
    updateCaption();
  }

  function updateCaption() {
    const caption = document.getElementById("mapCaption");
    if (!caption) return;
    if (!activeProvince) { caption.textContent = ""; return; }
    const p = provinceInfo(activeProvince);
    if (!p) return;
    const L = lang();
    const name = L === "en" ? p.name_en : p.name_ne;
    const capital = L === "en" ? p.capital_en : p.capital_ne;
    const seats = mode === "hor" ? p.hor : p.na;
    const houseLabel = mode === "hor" ? APP.t("house_hor") : APP.t("house_na");
    caption.textContent = `${name} · ${APP.t("houses_map_capital")}: ${capital} · ${houseLabel}: ${seats}`;
  }

  function renderMap() {
    const mount = document.getElementById("provinceMap");
    if (!mount || !GEO) return;
    const viewBox = "35 48 1155 700";
    const paths = GEO.districts.map(d => {
      const provinceId = (d.province || "").toLowerCase();
      const color = PROVINCE_COLORS[provinceId] || { fill: "#8F7420", stroke: "#6E5A18" };
      return `<path d="${d.d}" data-province="${provinceId}" data-district="${APP.escapeHtml(d.name)}" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.1" />`;
    }).join("");
    mount.innerHTML = `<svg viewBox="${viewBox}" role="img" aria-label="${APP.t("houses_map_title")}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;

    mount.querySelectorAll("path[data-province]").forEach(el => {
      el.addEventListener("mouseenter", () => setActive(el.dataset.province));
      el.addEventListener("mouseleave", () => setActive(null));
      el.addEventListener("click", () => setActive(activeProvince === el.dataset.province ? null : el.dataset.province));
      el.setAttribute("class", "district-shape");
    });
  }

  function render() {
    const nominatedNote = document.getElementById("mapNominatedNote");
    renderLegend();
    updateCaption();
    if (nominatedNote) {
      nominatedNote.style.display = mode === "na" ? "block" : "none";
      if (mode === "na") {
        nominatedNote.textContent = `+${SEATS.na_nominated} ${APP.t("houses_map_nominated")}`;
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
      [SEATS, GEO] = await Promise.all([
        APP.loadJSON("province_seats.json"),
        APP.loadJSON("nepal_districts.json"),
      ]);
    } catch (e) {
      const mount = document.getElementById("provinceMap");
      if (mount) mount.innerHTML = `<p class="panel-text-sm">Province data unavailable.</p>`;
      return;
    }
    renderMap();
    initToggle();
    render();
  }

  init();
})();
