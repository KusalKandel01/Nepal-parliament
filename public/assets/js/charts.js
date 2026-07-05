/* ============================================================
   charts.js — pure SVG chart rendering, zero dependencies.
   Powers statistics.html: party donut, house split, district bars.
   ============================================================ */

const CHARTS = (() => {
  function polarToCartesian(cx, cy, r, angleDeg) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function arcPath(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  /**
   * Render a donut chart into `mountEl`.
   * segments: [{ label, value, color }]
   */
  function donut(mountEl, segments, opts = {}) {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    const size = opts.size || 220;
    const cx = size / 2, cy = size / 2, r = size / 2 - 8, inner = r * 0.6;

    let angle = 0;
    let paths = "";
    segments.forEach(seg => {
      const sweep = (seg.value / total) * 360;
      const outerPath = arcPath(cx, cy, r, angle, angle + sweep);
      paths += `<path d="${outerPath}" fill="${seg.color}"><title>${seg.label}: ${seg.value}</title></path>`;
      angle += sweep;
    });

    const svg = `
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Party distribution donut chart">
        <mask id="donut-hole-${mountEl.id}">
          <rect width="${size}" height="${size}" fill="white"/>
          <circle cx="${cx}" cy="${cy}" r="${inner}" fill="black"/>
        </mask>
        <g mask="url(#donut-hole-${mountEl.id})">${paths}</g>
        <circle cx="${cx}" cy="${cy}" r="${inner}" fill="none"/>
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="700" font-size="${size*0.13}" fill="var(--ink)">${total}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="${size*0.06}" fill="var(--ink-muted)">सदस्यहरू</text>
      </svg>
    `;
    mountEl.innerHTML = svg;
  }

  /**
   * Render a horizontal bar list into `mountEl`.
   * rows: [{ label, value, color }]
   */
  function barList(mountEl, rows, opts = {}) {
    const max = Math.max(...rows.map(r => r.value), 1);
    mountEl.innerHTML = rows.map(r => `
      <div class="bar-row">
        <div class="bar-label" title="${r.label}">${r.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.value / max * 100).toFixed(1)}%;background:${r.color || "var(--gold)"}"></div></div>
        <div class="bar-value">${r.value}</div>
      </div>
    `).join("");
  }

  /**
   * Simple vertical bar chart (SVG) for two-category comparisons (e.g. HoR vs NA).
   */
  function columnChart(mountEl, cols, opts = {}) {
    const w = opts.width || 320, h = opts.height || 180;
    const max = Math.max(...cols.map(c => c.value), 1);
    const barW = (w - 40) / cols.length - 16;
    const baseY = h - 30;
    let bars = "";
    cols.forEach((c, i) => {
      const barH = (c.value / max) * (h - 60);
      const x = 30 + i * ((w - 40) / cols.length);
      const y = baseY - barH;
      bars += `
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="6" fill="${c.color}"><title>${c.label}: ${c.value}</title></rect>
        <text x="${x + barW/2}" y="${baseY + 18}" text-anchor="middle" font-size="12" fill="var(--ink-muted)" font-family="DM Sans, sans-serif">${c.label}</text>
        <text x="${x + barW/2}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)" font-family="DM Sans, sans-serif">${c.value}</text>
      `;
    });
    mountEl.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="Column chart">${bars}</svg>`;
  }

  return { donut, barList, columnChart };
})();
