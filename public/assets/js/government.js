/* ============================================================
   government.js, renders assets/data/government_sites.json as
   two grids (federal ministries, other constitutional bodies)
   on government.html, with a client-side text filter.
   ============================================================ */
(function () {
  let DATA = null;

  function lang() { return APP.getLang(); }

  function cardMarkup(item, isMinistry) {
    const L = lang();
    const name = L === "en" ? item.name_en : item.name_ne;
    const secondaryName = L === "en" ? item.name_ne : item.name_en;
    const fn = L === "en" ? item.function_en : item.function_ne;
    const extra = item.extra ? `<p class="gov-extra"><strong>${APP.t("gov_extra_label")}:</strong> ${APP.escapeHtml(item.extra)}</p>` : "";
    const minister = isMinistry
      ? `<p class="gov-minister"><strong>${APP.t("gov_minister_label")}:</strong> <span translate="no">${APP.escapeHtml(item.minister)}</span></p>`
      : "";
    const siteBlock = item.url
      ? `<a class="btn gov-site-link" href="${item.url}" target="_blank" rel="noopener noreferrer" translate="no">${APP.ICONS.flag}${APP.t("gov_visit_site")}: ${item.url.replace(/^https?:\/\//, "")}</a>`
      : `<p class="gov-site-unavailable">${APP.t("gov_site_unavailable")}</p>`;

    return `
      <article class="gov-card" data-search="${APP.escapeHtml((item.name_en + " " + item.name_ne).toLowerCase())}">
        <h3 class="gov-name">${APP.escapeHtml(name)}<span class="gov-name-secondary" translate="no">${APP.escapeHtml(secondaryName)}</span></h3>
        ${minister}
        <p class="gov-function"><strong>${APP.t("gov_function_label")}:</strong> ${APP.escapeHtml(fn)}</p>
        ${extra}
        ${siteBlock}
      </article>`;
  }

  function render() {
    const metaMount = document.getElementById("govMeta");
    if (metaMount) {
      metaMount.innerHTML = `<strong>${APP.t("gov_asof_label")}:</strong> ${APP.escapeHtml(DATA.as_of)} &middot; ${APP.escapeHtml(APP.t("gov_note_reorg"))}`;
    }
    document.getElementById("govMinistries").innerHTML = DATA.ministries.map(m => cardMarkup(m, true)).join("");
    document.getElementById("govOther").innerHTML = DATA.other_bodies.map(b => cardMarkup(b, false)).join("");
    const citizenMount = document.getElementById("govCitizen");
    if (citizenMount) citizenMount.innerHTML = (DATA.citizen_services || []).map(s => cardMarkup(s, false)).join("");
  }

  function initSearch() {
    const input = document.getElementById("govSearch");
    if (!input) return;
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      document.querySelectorAll(".gov-card").forEach(card => {
        card.style.display = !q || card.dataset.search.includes(q) ? "" : "none";
      });
    });
  }

  async function init() {
    try {
      DATA = await APP.loadJSON("government_sites.json");
    } catch (e) {
      document.getElementById("govMinistries").innerHTML = `<p class="panel-text-sm">Data unavailable.</p>`;
      return;
    }
    render();
    initSearch();
  }

  init();
})();
