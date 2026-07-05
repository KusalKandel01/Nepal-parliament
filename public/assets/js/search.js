/* ============================================================
   search.js — homepage hero search box: live suggestions that
   link into directory.html with the query pre-filled.
   ============================================================ */

(async function () {
  const input = document.getElementById("heroSearchInput");
  if (!input) return;

  const form = document.getElementById("heroSearchForm");
  const suggestBox = document.getElementById("heroSuggestions");

  let index = [];
  try {
    index = await APP.loadJSON("search-index.json");
  } catch (e) {
    // fail silently on homepage; directory page will surface the real error
  }

  function goToDirectory(q) {
    const url = "directory.html" + (q ? `?q=${encodeURIComponent(q)}` : "");
    window.location.href = url;
  }

  function renderSuggestions(query) {
    if (!suggestBox) return;
    const q = query.trim().toLowerCase();
    if (!q) { suggestBox.innerHTML = ""; suggestBox.hidden = true; return; }

    const matches = index.filter(m => {
      const hay = [m.n, m.e, m.d, m.p].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    }).slice(0, 6);

    if (matches.length === 0) {
      suggestBox.innerHTML = `<div class="suggest-empty">कुनै मिल्दो नतिजा फेला परेन — Enter थिचेर पूर्ण खोज हेर्नुहोस्</div>`;
      suggestBox.hidden = false;
      return;
    }

    suggestBox.innerHTML = matches.map(m => `
      <a class="suggest-item" href="member.html?id=${m.id}">
        <span class="suggest-avatar" style="background:${APP.partyColorVar(m.p)}">${(m.n||"?").replace(/^मा\.\s*/,"").charAt(0)}</span>
        <span class="suggest-text">
          <span class="suggest-name">${APP.highlight(m.n, query)}</span>
          <span class="suggest-meta">${APP.escapeHtml(m.d || "")} · ${APP.escapeHtml(m.p || "")}</span>
        </span>
      </a>
    `).join("") + `<button type="button" class="suggest-all" data-q="${APP.escapeHtml(query)}">"${APP.escapeHtml(query)}" को लागि सबै नतिजा हेर्नुहोस् →</button>`;
    suggestBox.hidden = false;

    suggestBox.querySelector(".suggest-all").addEventListener("click", (e) => {
      goToDirectory(e.currentTarget.dataset.q);
    });
  }

  const debounced = APP.debounce(() => renderSuggestions(input.value), 200);
  input.addEventListener("input", debounced);
  input.addEventListener("focus", () => { if (input.value.trim()) renderSuggestions(input.value); });
  document.addEventListener("click", (e) => {
    if (suggestBox && !suggestBox.contains(e.target) && e.target !== input) {
      suggestBox.hidden = true;
    }
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      goToDirectory(input.value.trim());
    });
  }
})();
