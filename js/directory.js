/* ============================================================
   directory.js — search, filter, sort, pagination for index.html
   ============================================================ */

let MEMBERS_DATA = [];
let state = {
  query: '',
  house: 'all',
  party: '',
  letter: '',
  sort: 'sn',
  page: 1,
  perPage: 24,
  favorites: new Set(JSON.parse(localStorage.getItem('mp_favs') || '[]'))
};

const grid = document.getElementById('grid');
const resultMeta = document.getElementById('resultMeta');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const partyFilter = document.getElementById('partyFilter');
const sortSelect = document.getElementById('sortSelect');
const alphaRow = document.getElementById('alphaRow');
const statsRow = document.getElementById('statsRow');
const tabsRow = document.getElementById('houseTabs');

function initFilters(){
  const parties = [...new Set(MEMBERS_DATA.map(m=>m.political_party).filter(Boolean))].sort();
  parties.forEach(p=>{
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    partyFilter.appendChild(opt);
  });

  const letters = [...new Set(MEMBERS_DATA.map(m=> (m.full_name||'').trim()[0]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ne'));
  const allBtn = document.createElement('div');
  allBtn.className = 'alpha-btn active dev';
  allBtn.textContent = 'सबै';
  allBtn.onclick = ()=>{ state.letter=''; state.page=1; setActiveAlpha(allBtn); render(); };
  alphaRow.appendChild(allBtn);
  letters.forEach(l=>{
    const b = document.createElement('div');
    b.className = 'alpha-btn dev';
    b.textContent = l;
    b.onclick = ()=>{ state.letter=l; state.page=1; setActiveAlpha(b); render(); };
    alphaRow.appendChild(b);
  });
}
function setActiveAlpha(el){
  [...alphaRow.children].forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
}

function renderStats(){
  const total = MEMBERS_DATA.length;
  const hor = MEMBERS_DATA.filter(m=>m.house==='House of Representatives').length;
  const na = MEMBERS_DATA.filter(m=>m.house==='National Assembly').length;
  const withEmail = MEMBERS_DATA.filter(m=>m.emails && m.emails.length).length;
  const parties = new Set(MEMBERS_DATA.map(m=>m.political_party).filter(Boolean)).size;
  const stats = [
    [total, 'Total Members'],
    [hor, 'House of Representatives'],
    [na, 'National Assembly'],
    [withEmail, 'With Email on File'],
    [parties, 'Political Parties'],
  ];
  statsRow.innerHTML = stats.map(([n,l])=>`<div class="stat-card"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join('');
}

function getFiltered(){
  let list = MEMBERS_DATA.slice();
  if(state.house === 'favorites'){
    list = list.filter(m=>state.favorites.has(m.id));
  } else if(state.house !== 'all'){
    list = list.filter(m=>m.house === state.house);
  }
  if(state.party) list = list.filter(m=>m.political_party === state.party);
  if(state.letter) list = list.filter(m=>(m.full_name||'').trim().startsWith(state.letter));
  if(state.query){
    const q = state.query.toLowerCase();
    list = list.filter(m=>{
      return (m.full_name||'').toLowerCase().includes(q) ||
             (m.district_constituency||'').toLowerCase().includes(q) ||
             (m.political_party||'').toLowerCase().includes(q) ||
             (m.mobile_numbers||[]).some(p=>p.includes(q)) ||
             (m.emails||[]).some(e=>e.toLowerCase().includes(q)) ||
             (m.house||'').toLowerCase().includes(q);
    });
  }
  if(state.sort === 'name') list.sort((a,b)=>(a.full_name||'').localeCompare(b.full_name||'','ne'));
  else if(state.sort === 'party') list.sort((a,b)=>(a.political_party||'').localeCompare(b.political_party||'','ne'));
  else if(state.sort === 'district') list.sort((a,b)=>(a.district_constituency||'').localeCompare(b.district_constituency||'','ne'));
  else list.sort((a,b)=>a.sn_in_source - b.sn_in_source || (a.house).localeCompare(b.house));
  return list;
}

function cardHtml(m){
  const isFav = state.favorites.has(m.id);
  const mobiles = (m.mobile_numbers||[]);
  const email = (m.emails||[])[0];
  return `
  <div class="card" data-id="${m.id}">
    <span class="house-pill">${m.house === 'House of Representatives' ? 'HoR' : 'NA'}</span>
    <h3>${m.full_name || '(name pending review)'}</h3>
    <div class="party">${m.political_party || '—'}</div>
    ${m.district_constituency ? `<div class="row"><span class="k">District</span><span>${m.district_constituency}</span></div>` : ''}
    ${mobiles[0] ? `<div class="row"><span class="k">Mobile</span><a href="tel:+977${mobiles[0]}">${mobiles[0]}</a></div>` : ''}
    ${mobiles[1] ? `<div class="row"><span class="k">Alt.</span><a href="tel:+977${mobiles[1]}">${mobiles[1]}</a></div>` : ''}
    ${email ? `<div class="row"><span class="k">Email</span><a href="mailto:${email}">${email}</a></div>` : ''}
    <div class="card-actions">
      <button class="icon-btn fav ${isFav?'active':''}" data-action="fav">${isFav ? '★ Saved' : '☆ Save'}</button>
      <button class="icon-btn" data-action="copy">⧉ Copy</button>
    </div>
  </div>`;
}

function render(){
  const filtered = getFiltered();
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
  if(state.page > totalPages) state.page = totalPages;
  const start = (state.page-1)*state.perPage;
  const pageItems = filtered.slice(start, start+state.perPage);

  resultMeta.textContent = `${filtered.length} member${filtered.length!==1?'s':''} found`;

  grid.innerHTML = pageItems.length === 0
    ? `<div class="empty">No members match your search. Try a different name, district, or party.</div>`
    : pageItems.map(cardHtml).join('');

  let pagHtml = '';
  for(let p=1; p<=totalPages; p++){
    if(p===1 || p===totalPages || Math.abs(p-state.page)<=2){
      pagHtml += `<button class="page-btn ${p===state.page?'active':''}" data-page="${p}">${p}</button>`;
    } else if(Math.abs(p-state.page)===3){
      pagHtml += `<span style="padding:7px 4px;color:var(--muted);">…</span>`;
    }
  }
  pagination.innerHTML = totalPages > 1 ? pagHtml : '';
}

function wireEvents(){
  searchInput.addEventListener('input', e=>{ state.query = e.target.value; state.page=1; render(); });
  partyFilter.addEventListener('change', e=>{ state.party = e.target.value; state.page=1; render(); });
  sortSelect.addEventListener('change', e=>{ state.sort = e.target.value; render(); });

  tabsRow.addEventListener('click', e=>{
    const tab = e.target.closest('.house-tab');
    if(!tab) return;
    [...tabsRow.children].forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    state.house = tab.dataset.house;
    state.page = 1;
    render();
  });

  grid.addEventListener('click', e=>{
    const card = e.target.closest('.card');
    if(!card) return;
    const id = card.dataset.id;
    const m = MEMBERS_DATA.find(x=>x.id===id);
    if(e.target.closest('[data-action="fav"]')){
      if(state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
      localStorage.setItem('mp_favs', JSON.stringify([...state.favorites]));
      render();
    } else if(e.target.closest('[data-action="copy"]')){
      const text = `${m.full_name}\n${m.house}\n${m.political_party||''}\n${m.district_constituency||''}\n${(m.mobile_numbers||[]).join(', ')}\n${(m.emails||[]).join(', ')}`;
      navigator.clipboard && navigator.clipboard.writeText(text);
      const btn = e.target.closest('[data-action="copy"]');
      const old = btn.textContent;
      btn.textContent = '✓ Copied';
      setTimeout(()=>{ btn.textContent = old; }, 1200);
    }
  });

  pagination.addEventListener('click', e=>{
    const btn = e.target.closest('.page-btn');
    if(!btn) return;
    state.page = parseInt(btn.dataset.page);
    render();
    window.scrollTo({top:0, behavior:'smooth'});
  });

  document.addEventListener('keydown', e=>{
    if(e.key === '/' && document.activeElement !== searchInput){
      e.preventDefault();
      searchInput.focus();
    }
  });

  // deep-link support: ?q=search&house=National+Assembly
  const params = new URLSearchParams(location.search);
  if(params.get('q')){ state.query = params.get('q'); searchInput.value = state.query; }
  if(params.get('house')){ state.house = params.get('house'); }
}

async function init(){
  renderChrome('index.html');
  grid.innerHTML = `<div class="loading">Loading directory…</div>`;
  try{
    MEMBERS_DATA = await loadMembers();
  }catch(err){
    grid.innerHTML = `<div class="empty">Could not load directory data (${err.message}). If you're opening this file directly from disk, serve it with a local server instead — see README.md.</div>`;
    return;
  }
  initFilters();
  renderStats();
  wireEvents();
  render();
}
init();
