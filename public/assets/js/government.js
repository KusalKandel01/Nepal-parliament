/* ============================================================
   government.js, renders assets/data/government_sites.json as
   two grids (federal ministries, other constitutional bodies)
   on government.html, with a client-side text filter.
   ============================================================ */
(function () {
  let DATA = null;
  let memberIndex = {};

  function lang() { return APP.getLang(); }

  function cardMarkup(item, kind) {
    const L = lang();
    const name = L === "en" ? item.name_en : item.name_ne;
    const fn = L === "en" ? item.function_en : item.function_ne;
    const extraText = L === "en" ? item.extra : (item.extra_ne || item.extra);
    const extra = extraText ? `<p class="gov-extra"><strong>${APP.t("gov_extra_label")}:</strong> ${APP.escapeHtml(extraText)}</p>` : "";
    const holderLabelKey = kind === "leader" ? "gov_titleholder_label" : "gov_minister_label";
    const holderName = L === "en" ? item.minister : (item.minister_ne || item.minister);
    let holderMarkup = APP.escapeHtml(holderName || "");
    if (kind === "leader" && item.id === "primeminister" && memberIndex[item.minister_ne]) {
      holderMarkup = `<a href="member.html?id=${memberIndex[item.minister_ne]}">${holderMarkup}</a>`;
    } else if (kind === "leader" && item.id !== "primeminister") {
      holderMarkup = `<a href="national-leader.html?id=${item.id}">${holderMarkup}</a>`;
    }
    const holder = (kind === "ministry" || kind === "leader")
      ? `<p class="gov-minister"><strong>${APP.t(holderLabelKey)}:</strong> <span translate="no">${holderMarkup}</span></p>`
      : "";
    const siteBlock = item.url
      ? `<a class="btn gov-site-link" href="${item.url}" target="_blank" rel="noopener noreferrer" translate="no">${APP.ICONS.flag}${APP.t("gov_visit_site")}: ${item.url.replace(/^https?:\/\//, "")}</a>`
      : `<p class="gov-site-unavailable">${APP.t("gov_site_unavailable")}</p>`;

    return `
      <article class="gov-card" data-search="${APP.escapeHtml((item.name_en + " " + item.name_ne + " " + (item.minister || "") + " " + (item.minister_ne || "")).toLowerCase())}">
        <h3 class="gov-name">${APP.escapeHtml(name)}</h3>
        ${holder}
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
    const leadershipMount = document.getElementById("govNationalLeadership");
    if (leadershipMount) {
      leadershipMount.innerHTML = (DATA.national_leadership || []).map(l => cardMarkup(l, "leader")).join("");
    }
    document.getElementById("govMinistries").innerHTML = DATA.ministries.map(m => cardMarkup(m, "ministry")).join("");
    document.getElementById("govOther").innerHTML = DATA.other_bodies.map(b => cardMarkup(b, "other")).join("");
    const citizenMount = document.getElementById("govCitizen");
    if (citizenMount) citizenMount.innerHTML = (DATA.citizen_services || []).map(s => cardMarkup(s, "other")).join("");
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
    try {
      const members = await APP.loadJSON("members.json");
      members.members.forEach(m => {
        const key = (m.name_ne || "").replace(/^मा\.\s*|^डा\.\s*/, "").trim();
        if (key) memberIndex[key] = m.id;
      });
    } catch (e) {
      // Cross-linking the PM card to their full profile is a progressive
      // enhancement; safe to skip if members.json is unavailable.
    }
    render();
    initSearch();
  }

  init();
})();
