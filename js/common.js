/* ============================================================
   common.js — shared header, nav, footer, and theme toggle
   Included on every page.
   ============================================================ */

function renderChrome(activePage){
  const header = document.getElementById('siteHeader');
  const nav = document.getElementById('siteNav');
  const footer = document.getElementById('siteFooter');

  if(header){
    header.innerHTML = `
      <div class="top-inner">
        <a class="brand" href="index.html">
          <img class="crest" src="assets/emblem.png" alt="Nepal national emblem" width="44" height="44">
          <div>
            <h1 class="dev">संघीय संसद सम्पर्क निर्देशिका</h1>
            <p>Nepal Federal Parliament Contact Directory · Digitized Edition</p>
          </div>
        </a>
        <div class="top-actions">
          <button class="btn" id="themeToggle">🌙 Dark mode</button>
          <button class="btn" id="printBtn">🖨 Print</button>
        </div>
      </div>`;
  }

  if(nav){
    const links = [
      ["index.html", "Directory", "निर्देशिका"],
      ["parties.html", "Parties", "राजनीतिक दल"],
      ["statistics.html", "Statistics", "तथ्याङ्क"],
      ["downloads.html", "Downloads", "डाउनलोड"],
      ["about.html", "About", "बारेमा"],
    ];
    nav.innerHTML = `<div class="tabs-inner">` +
      links.map(([href,en,ne]) => `<a class="tab ${activePage===href?'active':''}" href="${href}">${en} <span class="dev tab-ne">${ne}</span></a>`).join('') +
      `</div>`;
  }

  if(footer){
    footer.innerHTML = `
      Data digitized from the Federal Parliament Secretariat Telephone Directory (2083 BS).
      Some district/party fields were extracted via OCR and may need verification against the source document.<br>
      Built for citizens, journalists, researchers, and government staff. ·
      <a href="https://github.com" target="_blank" rel="noopener">View source on GitHub</a>
    `;
  }

  const themeToggle = document.getElementById('themeToggle');
  if(themeToggle){
    const stored = localStorage.getItem('mp_theme');
    if(stored === 'dark'){
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.textContent = '☀ Light mode';
    }
    themeToggle.addEventListener('click', ()=>{
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
      localStorage.setItem('mp_theme', isDark ? 'light' : 'dark');
      themeToggle.textContent = isDark ? '🌙 Dark mode' : '☀ Light mode';
    });
  }
  const printBtn = document.getElementById('printBtn');
  if(printBtn) printBtn.addEventListener('click', ()=> window.print());
}

/* Shared data loader used by every page */
async function loadMembers(){
  const res = await fetch('data/members.json');
  if(!res.ok) throw new Error('Failed to load members.json');
  return res.json();
}
async function loadOffices(){
  const res = await fetch('data/leadership_offices.json');
  if(!res.ok) throw new Error('Failed to load leadership_offices.json');
  return res.json();
}
