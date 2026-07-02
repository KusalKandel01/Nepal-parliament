/* ============================================================
   parties.js — Political Parties directory (grouped, expandable)
   ============================================================ */

const PALETTE = ['#2563b0','#c9a227','#1a4d8f','#5b9bd5','#8fb8e0','#0b2545','#a3c4e8','#d4b657','#123a6b','#6f9dcf'];

function groupByParty(members){
  const groups = {};
  members.forEach(m=>{
    const p = m.political_party || 'Unaffiliated / स्वतन्त्र';
    if(!groups[p]) groups[p] = { hor: [], na: [] };
    if(m.house === 'House of Representatives') groups[p].hor.push(m);
    else groups[p].na.push(m);
  });
  return groups;
}

function memberRow(m){
  const mob = (m.mobile_numbers||[])[0];
  const email = (m.emails||[])[0];
  return `<tr>
    <td class="dev">${m.full_name || '(pending review)'}</td>
    <td>${m.house === 'House of Representatives' ? 'HoR' : 'NA'}</td>
    <td>${m.district_constituency || '—'}</td>
    <td>${mob ? `<a href="tel:+977${mob}">${mob}</a>` : '—'}</td>
    <td>${email ? `<a href="mailto:${email}">${email}</a>` : '—'}</td>
  </tr>`;
}

function partyCard(name, group, color){
  const total = group.hor.length + group.na.length;
  const id = 'party-' + name.replace(/[^a-zA-Z0-9]/g,'').slice(0,40);
  const allMembers = [...group.hor, ...group.na];
  return `
  <div class="section party-card">
    <div class="party-card-head" data-target="${id}">
      <span class="party-swatch" style="background:${color};"></span>
      <div style="flex:1;">
        <h3 class="dev" style="margin:0;">${name}</h3>
        <div style="font-size:12.5px;color:var(--muted);">${total} member${total!==1?'s':''} — ${group.hor.length} HoR, ${group.na.length} NA</div>
      </div>
      <button class="icon-btn" data-toggle="${id}">Show members ▾</button>
    </div>
    <div class="party-card-body" id="${id}" hidden>
      <table class="data-table">
        <tr><th>Name</th><th>House</th><th>District / Constituency</th><th>Mobile</th><th>Email</th></tr>
        ${allMembers.map(memberRow).join('')}
      </table>
    </div>
  </div>`;
}

async function init(){
  renderChrome('parties.html');
  const container = document.getElementById('partiesContainer');
  container.innerHTML = `<div class="loading">Loading parties…</div>`;

  let members;
  try{
    members = await loadMembers();
  }catch(err){
    container.innerHTML = `<div class="empty">Could not load data (${err.message}).</div>`;
    return;
  }

  const groups = groupByParty(members);
  const sorted = Object.entries(groups).sort((a,b)=>
    (b[1].hor.length+b[1].na.length) - (a[1].hor.length+a[1].na.length)
  );

  document.getElementById('statsRow').innerHTML = [
    [sorted.length, 'Political Parties / Groups'],
    [members.length, 'Total Members Represented'],
    [sorted[0] ? sorted[0][0] : '—', 'Largest Party'],
  ].map(([n,l])=>`<div class="stat-card"><div class="num" style="font-size:${typeof n==='string' && n.length>14 ? '15px':'26px'};">${n}</div><div class="lbl">${l}</div></div>`).join('');

  container.innerHTML = sorted.map(([name, group], i)=> partyCard(name, group, PALETTE[i % PALETTE.length])).join('');

  container.addEventListener('click', e=>{
    const head = e.target.closest('.party-card-head');
    if(!head) return;
    const body = document.getElementById(head.dataset.target);
    const btn = head.querySelector('[data-toggle]');
    const isHidden = body.hasAttribute('hidden');
    if(isHidden){ body.removeAttribute('hidden'); btn.textContent = 'Hide members ▴'; }
    else { body.setAttribute('hidden',''); btn.textContent = 'Show members ▾'; }
  });
}
init();
