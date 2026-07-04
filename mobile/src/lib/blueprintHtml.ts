/**
 * blueprintHtml.ts — render the deterministic Vastu house plan as a PREMIUM HTML+SVG
 * floor plan for display inside a WebView. react-native-svg can't do soft shadows,
 * gradients or good typography; a WebView can — so the plan looks like a real architect's
 * sheet while the geometry stays 100% from the deterministic engine (no AI free-hand).
 */
import { Blueprint, BpRoom } from './vastuBlueprint';

const L = (o: { en: string; hi: string } | undefined, hi: boolean) => (o ? (hi ? o.hi : o.en) : '');
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = (n: number) => Math.round(n * 10) / 10;
const ftl = (n: number) => `${Math.round(n)}'`;

// soft pastel fill per room type
const FILL: Record<string, string> = {
  master: '#aecbf0', bedroom: '#c3daf4', guestBedroom: '#d2e3f7', kitchen: '#f6cf98',
  dining: '#efc7e6', living: '#bce6b6', bath: '#a4dde9', pooja: '#f6e6a2', study: '#e6d9a2',
  store: '#dad4bb', stairs: '#e2ccb0', parking: '#ccd6e2', veranda: '#ecdcb6', brahmasthan: '#f5edcf',
};

// furniture as light SVG strokes (feet coords)
function furniture(r: BpRoom): string {
  const { x, y, w, h, type: t } = r;
  const S = 'fill="none" stroke="#5a4a2e" stroke-width="0.14" opacity="0.72"';
  const min = Math.min(w, h);
  if (min < 7) return '';
  if (t === 'master' || t === 'bedroom' || t === 'guestBedroom') {
    const bw = w * 0.4, bh = h * 0.48, bx = x + 1, by = y + h - bh - 1;
    return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="0.5" ${S}/>
      <rect x="${bx + 0.6}" y="${by + 0.6}" width="${bw * 0.38}" height="${bh * 0.2}" rx="0.3" ${S}/>
      <rect x="${bx + bw * 0.5}" y="${by + 0.6}" width="${bw * 0.38}" height="${bh * 0.2}" rx="0.3" ${S}/>
      <line x1="${bx}" y1="${by + bh * 0.34}" x2="${bx + bw}" y2="${by + bh * 0.34}" ${S}/>
      <rect x="${x + w - 2.4}" y="${y + 1}" width="1.4" height="${h * 0.42}" ${S}/>`;
  }
  if (t === 'kitchen') {
    return `<rect x="${x + 0.8}" y="${y + 0.8}" width="${w - 1.6}" height="2" ${S}/>
      <rect x="${x + 0.8}" y="${y + 0.8}" width="2" height="${h * 0.55}" ${S}/>
      <circle cx="${x + 1.8}" cy="${y + h * 0.34}" r="0.65" ${S}/>
      <circle cx="${x + w * 0.36}" cy="${y + 1.8}" r="0.5" ${S}/><circle cx="${x + w * 0.5}" cy="${y + 1.8}" r="0.5" ${S}/>`;
  }
  if (t === 'living') {
    const sw = w * 0.5, sx = x + (w - sw) / 2, sy = y + h - 3.2;
    return `<rect x="${sx}" y="${sy}" width="${sw}" height="2" rx="0.6" ${S}/>
      <rect x="${sx - 2.4}" y="${sy - 2.5}" width="1.9" height="2" rx="0.5" ${S}/>
      <rect x="${sx + sw + 0.4}" y="${sy - 2.5}" width="1.9" height="2" rx="0.5" ${S}/>
      <line x1="${sx + sw * 0.25}" y1="${y + 1}" x2="${sx + sw * 0.75}" y2="${y + 1}" stroke="#5a4a2e" stroke-width="0.4" opacity="0.7"/>`;
  }
  if (t === 'dining') {
    const cx = x + w / 2, cy = y + h / 2, rx = Math.min(3, w * 0.22), ry = Math.min(1.9, h * 0.15);
    let seats = '';
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => { seats += `<rect x="${cx + dx * (rx + 1.1) - 0.6}" y="${cy + dy * (ry + 1.1) - 0.6}" width="1.2" height="1.2" rx="0.25" ${S}/>`; });
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${S}/>${seats}`;
  }
  if (t === 'pooja') { const cx = x + w / 2; return `<rect x="${cx - 1.5}" y="${y + 1.4}" width="3" height="2" ${S}/><polygon points="${cx},${y + 0.4} ${cx - 1.7},${y + 1.4} ${cx + 1.7},${y + 1.4}" ${S}/>`; }
  if (t === 'stairs') { let ln = ''; const n = 5, st = (h - 2) / n; for (let i = 0; i < n; i++) ln += `<line x1="${x + 1}" y1="${y + 1 + i * st}" x2="${x + w - 1}" y2="${y + 1 + i * st}" ${S}/>`; return ln; }
  if (t === 'parking') { const cw = Math.min(w * 0.55, 6), ch = Math.min(h * 0.42, 3.2), cx = x + (w - cw) / 2, cy = y + (h - ch) / 2; return `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="0.9" ${S}/><circle cx="${cx + cw * 0.25}" cy="${cy + ch}" r="0.55" ${S}/><circle cx="${cx + cw * 0.75}" cy="${cy + ch}" r="0.55" ${S}/>`; }
  if (t === 'study') return `<rect x="${x + 1}" y="${y + 1}" width="${w * 0.5}" height="1.7" ${S}/>`;
  return '';
}

// door swing toward the built centre
function door(r: BpRoom, bcx: number, bcy: number): string {
  if (r.type === 'brahmasthan' || r.type === 'veranda') return '';
  const S = 'fill="none" stroke="#8a744d" stroke-width="0.12"';
  const dxc = bcx - (r.x + r.w / 2), dyc = bcy - (r.y + r.h / 2);
  const horiz = Math.abs(dxc) > Math.abs(dyc);
  const dw = Math.min(3, Math.max(2, Math.min(r.w, r.h) * 0.3));
  if (horiz) {
    const ex = dxc > 0 ? r.x + r.w : r.x, y0 = r.y + r.h / 2 - dw / 2, dir = dxc > 0 ? 1 : -1;
    return `<line x1="${ex}" y1="${y0}" x2="${ex}" y2="${y0 + dw}" stroke="#faf6ee" stroke-width="0.5"/>
      <path d="M ${ex} ${y0} A ${dw} ${dw} 0 0 ${dxc > 0 ? 1 : 0} ${ex + dir * dw} ${y0 + dw}" ${S}/>
      <line x1="${ex}" y1="${y0}" x2="${ex + dir * dw}" y2="${y0 + dw}" stroke="#5a4a2e" stroke-width="0.14"/>`;
  }
  const ey = dyc > 0 ? r.y + r.h : r.y, x0 = r.x + r.w / 2 - dw / 2, dir = dyc > 0 ? 1 : -1;
  return `<line x1="${x0}" y1="${ey}" x2="${x0 + dw}" y2="${ey}" stroke="#faf6ee" stroke-width="0.5"/>
    <path d="M ${x0} ${ey} A ${dw} ${dw} 0 0 ${dyc > 0 ? 0 : 1} ${x0 + dw} ${ey + dir * dw}" ${S}/>
    <line x1="${x0}" y1="${ey}" x2="${x0 + dw}" y2="${ey + dir * dw}" stroke="#5a4a2e" stroke-width="0.14"/>`;
}

// exterior windows (double tick)
function windows(r: BpRoom, W: number, H: number): string {
  if (r.type === 'brahmasthan' || r.type === 'veranda') return '';
  const eps = 0.2, cx = r.x + r.w / 2, cy = r.y + r.h / 2, wl = Math.min(4, r.w * 0.35), wv = Math.min(4, r.h * 0.35);
  const win = (x1: number, y1: number, x2: number, y2: number, vert: boolean) => {
    const o = 0.28;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#faf6ee" stroke-width="0.55"/>` +
      (vert ? `<line x1="${x1 - o}" y1="${y1}" x2="${x2 - o}" y2="${y2}" stroke="#5a4a2e" stroke-width="0.1"/><line x1="${x1 + o}" y1="${y1}" x2="${x2 + o}" y2="${y2}" stroke="#5a4a2e" stroke-width="0.1"/>`
        : `<line x1="${x1}" y1="${y1 - o}" x2="${x2}" y2="${y2 - o}" stroke="#5a4a2e" stroke-width="0.1"/><line x1="${x1}" y1="${y1 + o}" x2="${x2}" y2="${y2 + o}" stroke="#5a4a2e" stroke-width="0.1"/>`);
  };
  let s = '';
  if (r.y <= eps) s += win(cx - wl / 2, 0, cx + wl / 2, 0, false);
  if (Math.abs(r.y + r.h - H) <= eps) s += win(cx - wl / 2, H, cx + wl / 2, H, false);
  if (r.x <= eps) s += win(0, cy - wv / 2, 0, cy + wv / 2, true);
  if (Math.abs(r.x + r.w - W) <= eps) s += win(W, cy - wv / 2, W, cy + wv / 2, true);
  return s;
}

export function blueprintHtml(bp: Blueprint, hi: boolean, dark: boolean, mandala = false): string {
  const W = bp.builtW, H = bp.builtL;
  const M = { l: Math.max(7, W * 0.14), r: Math.max(9, W * 0.16), t: 12, b: 16 };
  const vbW = W + M.l + M.r, vbH = H + M.t + M.b;
  const bcx = W / 2, bcy = H / 2;

  const paper = dark ? '#f4efe2' : '#fbf7ee';       // the sheet stays paper-like in both themes
  const wall = '#2f2718', border = '#7a6640', ink = '#2a2010', mute = '#8a744d';

  // rooms
  const roomSvg = bp.rooms.map((r) => {
    const fill = FILL[r.type] || '#e6ddc6';
    const open = r.type === 'brahmasthan';
    const nameF = Math.max(1.7, Math.min(2.7, Math.min(r.w, r.h) * 0.16));
    const showName = Math.min(r.w, r.h) > 4.5;
    const showDim = Math.min(r.w, r.h) > 9;
    const sub = (r.sub || []).map((sb) => {
      const sf = sb.type === 'bath' ? '#a4dde9' : '#d3ccae';
      return `<g><rect x="${sb.x}" y="${sb.y}" width="${sb.w}" height="${sb.h}" rx="0.4" fill="${sf}" fill-opacity="0.85" stroke="${wall}" stroke-width="0.18"/>
        <text x="${sb.x + sb.w / 2}" y="${sb.y + sb.h / 2 + 0.6}" text-anchor="middle" font-size="1.5" font-weight="600" fill="${ink}">${esc(L(sb.name, hi))}</text></g>`;
    }).join('');
    const nx = r.x + r.w / 2 + (r.sub && r.sub[0] ? (r.sub[0].x > r.x ? -r.w * 0.15 : r.w * 0.15) : 0);
    const ny = r.y + r.h / 2 + (r.sub && r.sub[0] ? (r.sub[0].y <= r.y ? r.h * 0.2 : -r.h * 0.15) : 0);
    return `<g id="${r.id}">
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="0.8" fill="${fill}" fill-opacity="${open ? 0.35 : 0.62}" stroke="${border}" stroke-width="0.22" filter="url(#sh)" ${open ? 'stroke-dasharray="1.2 0.8"' : ''}/>
      ${open ? '' : furniture(r)}
      ${door(r, bcx, bcy)}
      ${windows(r, W, H)}
      ${sub}
      ${showName ? `<text x="${nx}" y="${ny - (showDim ? 0.3 : -nameF * 0.35)}" text-anchor="middle" font-size="${nameF}" font-weight="700" fill="${ink}" font-family="Georgia,serif">${esc(L(r.name, hi))}</text>` : ''}
      ${showDim ? `<text x="${nx}" y="${ny + 2.4}" text-anchor="middle" font-size="1.75" fill="${mute}">${ftl(r.w)} × ${ftl(r.h)} · ${r.areaSqft} sq ft</text>` : ''}
    </g>`;
  }).join('');

  // outer double wall
  const outer = `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${wall}" stroke-width="0.9"/>
    <rect x="0.7" y="0.7" width="${W - 1.4}" height="${H - 1.4}" fill="none" stroke="${wall}" stroke-width="0.22"/>`;

  // entrance
  const e = bp.entrance, evert = e.x1 === e.x2;
  const emx = (e.x1 + e.x2) / 2, emy = (e.y1 + e.y2) / 2;
  const entrance = `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="${paper}" stroke-width="1.3"/>
    <text x="${evert ? emx + (e.x1 === 0 ? -1 : 1) * 3.4 : emx}" y="${evert ? emy : emy + (e.y1 === 0 ? -1.4 : 3.4)}" text-anchor="${evert ? (e.x1 === 0 ? 'end' : 'start') : 'middle'}" font-size="1.9" font-weight="700" fill="#b8860b">⌂ ${esc(L(e.label, hi))}</text>`;

  // markers
  const markers = bp.markers.map((m) => `<circle cx="${m.x}" cy="${m.y}" r="1.9" fill="none" stroke="#2980b9" stroke-width="0.2" stroke-dasharray="0.8 0.5"/><text x="${m.x}" y="${m.y + 0.7}" text-anchor="middle" font-size="1.6" fill="#2980b9">💧</text>`).join('');

  // Vastu mandala overlay
  const mand = mandala ? (() => {
    const zn = [['वायव्य', 'NW', '#c7d2e8'], ['उत्तर', 'N', '#bfe0d0'], ['ईशान', 'NE', '#f2e6a8'], ['पश्चिम', 'W', '#d7cdb0'], ['ब्रह्म', 'C', '#f0d98a'], ['पूर्व', 'E', '#cfe3b8'], ['नैऋत्य', 'SW', '#b8a483'], ['दक्षिण', 'S', '#e6c2a0'], ['आग्नेय', 'SE', '#e9b48f']];
    let s = '';
    zn.forEach((z, i) => { const c = i % 3, rr = Math.floor(i / 3); const cw = W / 3, ch = H / 3; s += `<rect x="${c * cw}" y="${rr * ch}" width="${cw}" height="${ch}" fill="${z[2]}" fill-opacity="0.22" stroke="#b8860b" stroke-width="0.15" stroke-dasharray="0.8 0.6"/><text x="${c * cw + cw / 2}" y="${rr * ch + 2.2}" text-anchor="middle" font-size="1.7" font-weight="700" fill="#7a5a10">${hi ? z[0] : z[1]}</text>`; });
    return `<g>${s}</g>`;
  })() : '';

  // dimension lines
  const dims = `<g stroke="${ink}" stroke-width="0.14" fill="${ink}">
    <line x1="0" y1="${H + 4}" x2="${W}" y2="${H + 4}"/>
    <line x1="0" y1="${H + 3.2}" x2="0" y2="${H + 4.8}"/><line x1="${W}" y1="${H + 3.2}" x2="${W}" y2="${H + 4.8}"/>
    <text x="${W / 2}" y="${H + 6.6}" text-anchor="middle" font-size="2" stroke="none">${ftl(W)}</text>
    <line x1="-4" y1="0" x2="-4" y2="${H}"/>
    <line x1="-4.8" y1="0" x2="-3.2" y2="0"/><line x1="-4.8" y1="${H}" x2="-3.2" y2="${H}"/>
    <text x="-6" y="${H / 2}" text-anchor="middle" font-size="2" stroke="none" transform="rotate(-90 -6 ${H / 2})">${ftl(H)}</text>
  </g>`;

  // compass rose (top-right)
  const cxN = W + M.r * 0.5, cyN = -M.t * 0.5;
  const compass = `<g transform="translate(${cxN} ${cyN})">
    <circle r="4" fill="#fff" fill-opacity="0.6" stroke="#b8860b" stroke-width="0.2"/>
    <polygon points="0,-3.4 -1,0 0,-1 1,0" fill="#c0392b"/><polygon points="0,3.4 -1,0 0,1 1,0" fill="${wall}"/>
    <text x="0" y="-4.4" text-anchor="middle" font-size="2" font-weight="700" fill="#c0392b">${hi ? 'उ' : 'N'}</text></g>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes"/>
<style>
  html,body{margin:0;padding:0;background:${dark ? '#0a0a06' : '#fff'};}
  .sheet{background:${paper};background-image:radial-gradient(rgba(120,100,60,0.10) 0.5px, transparent 0.5px);background-size:6px 6px;
    border:1px solid #cbb26a;border-radius:14px;margin:8px;padding:6px;box-shadow:0 6px 22px rgba(0,0,0,0.28);}
  svg{width:100%;height:auto;display:block;}
  .tb{display:flex;justify-content:space-between;align-items:center;font-family:Georgia,serif;color:${ink};padding:4px 8px 2px;}
  .tb b{font-size:14px;letter-spacing:0.3px;}
  .tb span{font-size:10px;color:${mute};}
</style></head>
<body><div class="sheet">
  <div class="tb"><b>${hi ? 'वास्तु भूतल नक्शा' : 'Vastu Floor Plan'}</b><span>${hi ? 'निर्माण' : 'Built'} ${ftl(W)}×${ftl(H)} · ${hi ? 'मुख' : 'facing'} ${bp.input.facing} · grid 5ft</span></div>
  <svg viewBox="${-M.l} ${-M.t} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
    <defs>
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0.15" dy="0.3" stdDeviation="0.35" flood-color="#000" flood-opacity="0.18"/></filter>
      <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M5 0H0V5" fill="none" stroke="#d9cca6" stroke-width="0.06"/></pattern>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#grid)"/>
    ${roomSvg}
    ${mand}
    ${outer}
    ${entrance}
    ${markers}
    ${dims}
    ${compass}
  </svg>
</div></body></html>`;
}
