/* ============================================================
   statistics.js — dashboard charts (pure SVG, no dependencies)
   ============================================================ */

function svgBarChart(data, opts={}){
  const w = opts.width || 640, barH = 26, gap = 10, labelW = opts.labelW || 220;
  const max = Math.max(...data.map(d=>d.value), 1);
  const chartW = w - labelW - 60;
  const h = data.length * (barH+gap) + gap;
  let rows = '';
  data.forEach((d,i)=>{
    const y = gap + i*(barH+gap);
    const bw = Math.max(2, (d.value/max) * chartW);
    rows += `
      <text x="${labelW-10}" y="${y+barH/2+4}" text-anchor="end" font-size="12" fill="var(--ink)" class="dev">${d.label}</text>
      <rect x="${labelW}" y="${y}" width="${bw}" height="${barH}" rx="4" fill="${d.color||'#2563b0'}"/>
      <text x="${labelW+bw+8}" y="${y+barH/2+4}" font-size="12" fill="var(--muted)">${d.value}</text>
    `;
  });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" xmlns="http://www.w3.org/2000/svg">${rows}</svg>`;
}

function svgDonut(data, opts={}){
  const size = opts.size || 220, r = size/2 - 14, cx = size/2, cy = size/2, cs = 2*Math.PI*r;
  const total = data.reduce((s,d)=>s+d.value,0) || 1;
  let offset = 0, arcs = '';
  data.forEach(d=>{
    const frac = d.value/total;
    const len = frac * cs;
    arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}" stroke-width="26"
      stroke-dasharray="${len} ${cs-len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += len;
  });
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${arcs}
    <text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="22" font-weight="800" fill="var(--ink)">${total}</text>
    <text x="${cx}" y="${cy+16}" text-anchor="middle" font-size="11" fill="var(--muted)">Members</text>
  </svg>`;
}

const PALETTE = ['#2563b0','#c9a227','#1a4d8f','#5b9bd5','#8fb8e0','#0b2545','#a3c4e8','#d4b657','#123a6b','#6f9dcf'];

async function init(){
  renderChrome('statistics.html');
  const members = await loadMembers();

  // House split
  const hor = members.filter(m=>m.house==='House of Representatives').length;
  const na = members.filter(m=>m.house==='National Assembly').length;
  document.getElementById('houseDonut').innerHTML = svgDonut(
    [{label:'HoR', value:hor, color:'#2563b0'},{label:'NA', value:na, color:'#c9a227'}]
  );
  document.getElementById('houseLegend').innerHTML = `
    <div class="row"><span style="width:12px;height:12px;border-radius:3px;background:#2563b0;display:inline-block;"></span> House of Representatives — ${hor}</div>
    <div class="row"><span style="width:12px;height:12px;border-radius:3px;background:#c9a227;display:inline-block;"></span> National Assembly — ${na}</div>
  `;

  // Coverage stats
  const partyCounts = {};
  members.forEach(m=>{ if(m.political_party) partyCounts[m.political_party] = (partyCounts[m.political_party]||0)+1; });
  const withEmail = members.filter(m=>m.emails && m.emails.length).length;
  const withMobile = members.filter(m=>m.mobile_numbers && m.mobile_numbers.length).length;
  const withDistrict = members.filter(m=>m.district_constituency).length;
  const highConf = members.filter(m=>m.data_confidence==='high').length;

  document.getElementById('coverageStats').innerHTML = [
    ['Email on file', withEmail, members.length],
    ['Mobile on file', withMobile, members.length],
    ['District/Constituency on file', withDistrict, members.length],
    ['High-confidence extraction', highConf, members.length],
  ].map(([label,val,tot])=>{
    const pct = Math.round(val/tot*100);
    return `<div class="stat-card">
      <div class="num">${pct}%</div>
      <div class="lbl">${label} (${val} / ${tot})</div>
    </div>`;
  }).join('');

  // Top stats row
  document.getElementById('statsRow').innerHTML = [
    [members.length, 'Total Members'],
    [Object.keys(partyCounts).length, 'Political Parties'],
    [hor, 'House of Representatives'],
    [na, 'National Assembly'],
  ].map(([n,l])=>`<div class="stat-card"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join('');
}
init();
