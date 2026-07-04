/**
 * blueprintHtml.ts — professional AutoCAD-style 2D architectural floor plan (WebView HTML+SVG).
 * Thin proportional walls (outer > inner > furniture > dims), open dotted Brahmasthan,
 * plot boundary + setbacks + construction boundary, engineering grid, compass rose, scale,
 * dimension lines, detailed thin-line furniture, and outdoor services (garden/parking/
 * borewell/septic/rainwater/solar/tank). Geometry is 100% deterministic (no AI drawing).
 */
import { Blueprint, BpRoom } from './vastuBlueprint';

const L = (o: { en: string; hi: string } | undefined, hi: boolean) => (o ? (hi ? o.hi : o.en) : '');
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ftl = (n: number) => `${Math.round(n)}'`;

// stroke weights in FEET (render like 8/4/2/1 px)
const W_OUT = 0.42, W_IN = 0.2, W_FUR = 0.1, W_DIM = 0.055;
const WALL = '#20242c', INK = '#20242c', MUTE = '#7d8697', FUR = '#5b6472';
const PAPER = '#ffffff', GRIDC = '#dfe4ee', PLOTC = '#9aa4b4';

// pastel room tints (used at ~13% opacity)
const FILL: Record<string, string> = {
  master: '#6c9bd6', bedroom: '#7fb0e0', guestBedroom: '#8fbde6', kitchen: '#e9a24d',
  dining: '#d97bb8', living: '#6cc074', bath: '#4bb6c9', pooja: '#e6c34a', study: '#c9b24a',
  store: '#a99f7c', stairs: '#b58a5e', parking: '#8595ab',
};
const F = (t: string) => FILL[t] || '#9aa4b4';
const fur = (d: string) => `fill="none" stroke="${FUR}" stroke-width="${W_FUR}" stroke-linejoin="round"`;

// ── detailed thin-line furniture (room-local coords) ────────────────────────
function furniture(r: BpRoom, x: number, y: number, w: number, h: number): string {
  const t = r.type, S = fur('');
  if (Math.min(w, h) < 5.5) return '';
  if (t === 'master' || t === 'bedroom' || t === 'guestBedroom') {
    const bw = Math.min(w * 0.6, 7), bh = Math.min(h * 0.52, 6.6), bx = x + 0.6, by = y + h - bh - 0.6;
    return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="0.35" ${S}/>
      <line x1="${bx}" y1="${by + 1}" x2="${bx + bw}" y2="${by + 1}" ${S}/>
      <rect x="${bx + 0.4}" y="${by + 0.25}" width="${bw / 2 - 0.7}" height="0.55" rx="0.2" ${S}/><rect x="${bx + bw / 2 + 0.3}" y="${by + 0.25}" width="${bw / 2 - 0.7}" height="0.55" rx="0.2" ${S}/>
      <path d="M${bx} ${by + bh * 0.55} Q${bx + bw / 2} ${by + bh * 0.45} ${bx + bw} ${by + bh * 0.55}" ${S}/>
      <rect x="${bx - 0.1}" y="${by - 1.5}" width="1.3" height="1.3" ${S}/><rect x="${bx + bw - 1.2}" y="${by - 1.5}" width="1.3" height="1.3" ${S}/>
      <rect x="${x + w - 1.9}" y="${y + 0.6}" width="1.5" height="${Math.min(h * 0.5, 6)}" ${S}/><line x1="${x + w - 1.9}" y1="${y + 0.6 + Math.min(h * 0.5, 6) / 2}" x2="${x + w - 0.4}" y2="${y + 0.6 + Math.min(h * 0.5, 6) / 2}" ${S}/>
      <rect x="${x + 0.6}" y="${y + 0.6}" width="2.6" height="1.3" ${S}/>`;   // study table
  }
  if (t === 'living') {
    const sx = x + 0.7, sy = y + h - 2.6, sw = Math.min(w - 4, 8.5);
    return `<rect x="${sx}" y="${sy}" width="${sw}" height="2.3" rx="0.5" ${S}/><rect x="${sx}" y="${sy - 0.5}" width="${sw}" height="0.6" ${S}/>
      <line x1="${sx + sw / 3}" y1="${sy}" x2="${sx + sw / 3}" y2="${sy + 2.3}" ${S}/><line x1="${sx + 2 * sw / 3}" y1="${sy}" x2="${sx + 2 * sw / 3}" y2="${sy + 2.3}" ${S}/>
      <rect x="${sx + sw + 0.5}" y="${sy - 2.4}" width="2.2" height="2.4" rx="0.4" ${S}/>
      <rect x="${sx + sw / 2 - 1.8}" y="${sy - 3.4}" width="3.6" height="1.5" rx="0.25" ${S}/>
      <rect x="${x + w / 2 - 3.2}" y="${y + 0.55}" width="6.4" height="0.7" ${S}/><line x1="${x + w / 2}" y1="${y + 1.25}" x2="${x + w / 2}" y2="${y + 2}" ${S}/>
      <rect x="${x + w - 2.6}" y="${y + h - 3}" width="1.9" height="1.9" rx="0.45" ${S}/>`;
  }
  if (t === 'kitchen') {
    return `<rect x="${x + 0.55}" y="${y + 0.55}" width="${w - 1.1}" height="1.8" ${S}/><rect x="${x + 0.55}" y="${y + 0.55}" width="1.8" height="${h - 1.1}" ${S}/>
      <rect x="${x + w * 0.36}" y="${y + 0.85}" width="2.2" height="1.2" ${S}/><circle cx="${x + w * 0.36 + 0.6}" cy="${y + 1.45}" r="0.32" ${S}/><circle cx="${x + w * 0.36 + 1.6}" cy="${y + 1.45}" r="0.32" ${S}/>
      <circle cx="${x + 1.45}" cy="${y + h * 0.5}" r="0.65" ${S}/>
      <rect x="${x + w - 2.5}" y="${y + h - 2.8}" width="1.9" height="2.4" ${S}/><line x1="${x + w - 2.5}" y1="${y + h - 1.6}" x2="${x + w - 0.6}" y2="${y + h - 1.6}" ${S}/>
      <rect x="${x + w - 2.5}" y="${y + 0.6}" width="1.9" height="1.6" ${S}/>
      <path d="M${x + w * 0.36} ${y + 0.5} L${x + w * 0.36 + 2.2} ${y + 0.5} L${x + w * 0.36 + 1.8} ${y - 0.05} L${x + w * 0.36 + 0.4} ${y - 0.05} Z" ${S}/>`;   // storage + chimney hood
  }
  if (t === 'dining') {
    const cx = x + w / 2, cy = y + h / 2, rw = Math.min(w * 0.42, 5.5), rh = Math.min(h * 0.3, 3.2);
    let ch = ''; for (let i = 0; i < 3; i++) { const px = cx - rw / 2 + rw * (i + 0.5) / 3; ch += `<rect x="${px - 0.65}" y="${cy - rh / 2 - 1.3}" width="1.3" height="0.9" rx="0.2" ${S}/><rect x="${px - 0.65}" y="${cy + rh / 2 + 0.4}" width="1.3" height="0.9" rx="0.2" ${S}/>`; }
    return `<rect x="${cx - rw / 2}" y="${cy - rh / 2}" width="${rw}" height="${rh}" rx="0.4" ${S}/>${ch}`;
  }
  if (t === 'bath') {
    return `<rect x="${x + 0.45}" y="${y + 0.45}" width="1.6" height="2.2" rx="0.35" ${S}/><ellipse cx="${x + 1.25}" cy="${y + 1.4}" rx="0.5" ry="0.7" ${S}/>
      <rect x="${x + w - 2}" y="${y + 0.45}" width="1.55" height="1.1" rx="0.25" ${S}/><circle cx="${x + w - 1.2}" cy="${y + 1}" r="0.45" ${S}/>
      <line x1="${x + w - 2}" y1="${y + 0.2}" x2="${x + w - 0.45}" y2="${y + 0.2}" ${S}/>
      <rect x="${x + w - 2.2}" y="${y + h - 2.2}" width="1.75" height="1.75" ${S}/><line x1="${x + w - 2.2}" y1="${y + h - 2.2}" x2="${x + w - 0.45}" y2="${y + h - 0.45}" ${S}/>`;
  }
  if (t === 'store') { let sh = ''; const n = 3; for (let i = 0; i < n; i++) sh += `<rect x="${x + 0.6}" y="${y + 0.6 + i * (h - 1.2) / n}" width="${w - 1.2}" height="${(h - 1.2) / n - 0.3}" ${S}/>`; return sh; }
  if (t === 'stairs') { let ln = ''; const n = 6, st = (h - 1.4) / n; for (let i = 0; i <= n; i++) ln += `<line x1="${x + 0.6}" y1="${y + 0.7 + i * st}" x2="${x + w - 0.6}" y2="${y + 0.7 + i * st}" ${S}/>`; return `${ln}<polygon points="${x + w / 2},${y + h - 0.8} ${x + w / 2 - 0.45},${y + h - 1.5} ${x + w / 2 + 0.45},${y + h - 1.5}" fill="${FUR}"/>`; }
  if (t === 'pooja') { const cx = x + w / 2; return `<rect x="${cx - 1.4}" y="${y + h - 2.6}" width="2.8" height="2" ${S}/><polygon points="${cx},${y + 0.5} ${cx - 1.8},${y + h - 2.6} ${cx + 1.8},${y + h - 2.6}" ${S}/><circle cx="${cx - 0.7}" cy="${y + h - 1.5}" r="0.3" ${S}/><circle cx="${cx + 0.7}" cy="${y + h - 1.5}" r="0.3" ${S}/>`; }
  if (t === 'study') return `<rect x="${x + 0.6}" y="${y + 0.6}" width="${Math.min(w * 0.6, 5)}" height="1.6" ${S}/><rect x="${x + w * 0.2}" y="${y + 2.5}" width="1.4" height="1.4" rx="0.3" ${S}/><rect x="${x + w - 1.6}" y="${y + 0.6}" width="1" height="${Math.min(h - 1.2, 5)}" ${S}/><line x1="${x + w - 1.6}" y1="${y + 2.1}" x2="${x + w - 0.6}" y2="${y + 2.1}" ${S}/><line x1="${x + w - 1.6}" y1="${y + 3.6}" x2="${x + w - 0.6}" y2="${y + 3.6}" ${S}/>`;
  return '';
}

export function planTextSummary(bp: Blueprint, hi: boolean): string {
  const head = hi ? `🏠 वास्तु नक्शा — निर्माण ${ftl(bp.builtW)} × ${ftl(bp.builtL)}, मुख ${bp.input.facing}` : `🏠 Vastu Plan — Built ${ftl(bp.builtW)} × ${ftl(bp.builtL)}, facing ${bp.input.facing}`;
  const rows = bp.rooms.map((r) => `• ${L(r.name, hi)} — ${L(r.direction, hi)} · ${ftl(r.w)}×${ftl(r.h)} · ${r.areaSqft} sq ft`).join('\n');
  return `${head}\n\n${rows}\n\n${hi ? 'वास्तु: नैऋत्य में मुख्य शयन, आग्नेय रसोई, ईशान पूजा, केंद्र खुला।' : 'Vastu: SW master, SE kitchen, NE pooja, open centre.'}`;
}

export function blueprintHtml(bp: Blueprint, hi: boolean, dark: boolean, mandala = false): string {
  const W = bp.builtW, H = bp.builtL;
  // setback margins (real plot if given, else a nominal setback so we can show plot+services)
  const realPlot = bp.plotW > W || bp.plotL > H;
  const pm = realPlot ? { n: Math.max(4, bp.margins.n), s: Math.max(4, bp.margins.s), e: Math.max(4, bp.margins.e), w: Math.max(4, bp.margins.w) }
    : { n: Math.max(8, H * 0.16), s: Math.max(5, H * 0.1), e: Math.max(8, W * 0.22), w: Math.max(5, W * 0.12) };
  const PLW = W + pm.w + pm.e, PLH = H + pm.n + pm.s;
  const EX = { l: pm.w + 8, r: pm.e + 9, t: pm.n + 12, b: pm.s + 16 };
  const bcx = W / 2, bcy = H / 2;

  // engineering grid: 1 ft minor + 5 ft major (as patterns → floor texture)
  const grid = `<defs>
    <pattern id="gmin" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0V1M0 1H1" fill="none" stroke="#edf0f6" stroke-width="0.03"/></pattern>
    <pattern id="gmaj" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M5 0V5M0 5H5" fill="none" stroke="#dbe1ec" stroke-width="0.06"/></pattern>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#gmin)"/><rect x="0" y="0" width="${W}" height="${H}" fill="url(#gmaj)"/>`;

  const bodies: string[] = [], openings: string[] = [], labels: string[] = [];
  let brahma = '';

  bp.rooms.forEach((r) => {
    if (r.type === 'brahmasthan') {
      // OPEN centre — no walls, no fill; dotted sacred circle + label only
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rr = Math.min(r.w, r.h) * 0.34;
      brahma = `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="#b8860b" stroke-width="${W_IN}" stroke-dasharray="1.2 0.9"/>
        <circle cx="${cx}" cy="${cy}" r="${rr * 0.5}" fill="none" stroke="#b8860b" stroke-width="${W_DIM}" stroke-dasharray="0.8 0.7"/>
        <text x="${cx}" y="${cy + 0.7}" text-anchor="middle" font-size="1.8" font-weight="700" fill="#8a6410">${hi ? 'ब्रह्मस्थान' : 'Brahmasthan'}</text>`;
      return;
    }
    // room floor + thin inner walls
    bodies.push(`<g id="${r.id}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${F(r.type)}" fill-opacity="0.18" stroke="${WALL}" stroke-width="${W_IN}"/>${furniture(r, r.x, r.y, r.w, r.h)}</g>`);
    (r.sub || []).forEach((sb) => bodies.push(`<rect x="${sb.x}" y="${sb.y}" width="${sb.w}" height="${sb.h}" fill="${F(sb.type === 'bath' ? 'bath' : 'store')}" fill-opacity="0.16" stroke="${WALL}" stroke-width="${W_IN}"/>${furniture({ ...r, type: 'bath', x: sb.x, y: sb.y, w: sb.w, h: sb.h } as BpRoom, sb.x, sb.y, sb.w, sb.h)}`));

    // door opening + swing (into the room, facing centre)
    const dxc = bcx - (r.x + r.w / 2), dyc = bcy - (r.y + r.h / 2), horiz = Math.abs(dxc) > Math.abs(dyc);
    const dw = Math.min(3, Math.max(2.4, Math.min(r.w, r.h) * 0.32));
    if (horiz) {
      const ex = dxc > 0 ? r.x + r.w : r.x, y0 = r.y + r.h / 2 - dw / 2, dir = dxc > 0 ? -1 : 1;
      openings.push(`<line x1="${ex}" y1="${y0}" x2="${ex}" y2="${y0 + dw}" stroke="${PAPER}" stroke-width="${W_IN * 1.6}"/>
        <line x1="${ex}" y1="${y0}" x2="${ex + dir * dw}" y2="${y0}" stroke="${FUR}" stroke-width="${W_FUR}"/>
        <path d="M${ex + dir * dw} ${y0} A ${dw} ${dw} 0 0 ${dir > 0 ? 1 : 0} ${ex} ${y0 + dw}" fill="none" stroke="${MUTE}" stroke-width="${W_FUR}"/>`);
    } else {
      const ey = dyc > 0 ? r.y + r.h : r.y, x0 = r.x + r.w / 2 - dw / 2, dir = dyc > 0 ? -1 : 1;
      openings.push(`<line x1="${x0}" y1="${ey}" x2="${x0 + dw}" y2="${ey}" stroke="${PAPER}" stroke-width="${W_IN * 1.6}"/>
        <line x1="${x0}" y1="${ey}" x2="${x0}" y2="${ey + dir * dw}" stroke="${FUR}" stroke-width="${W_FUR}"/>
        <path d="M${x0} ${ey + dir * dw} A ${dw} ${dw} 0 0 ${dir > 0 ? 0 : 1} ${x0 + dw} ${ey}" fill="none" stroke="${MUTE}" stroke-width="${W_FUR}"/>`);
    }

    // windows on exterior walls (clear 3-line symbol)
    const eps = 0.2, cx = r.x + r.w / 2, cy = r.y + r.h / 2, wl = Math.min(4.5, r.w * 0.42), wv = Math.min(4.5, r.h * 0.42);
    const winH = (mx: number, yy: number) => `<line x1="${mx - wl / 2}" y1="${yy}" x2="${mx + wl / 2}" y2="${yy}" stroke="${PAPER}" stroke-width="${W_IN * 1.8}"/><line x1="${mx - wl / 2}" y1="${yy - 0.22}" x2="${mx + wl / 2}" y2="${yy - 0.22}" stroke="${WALL}" stroke-width="${W_FUR}"/><line x1="${mx - wl / 2}" y1="${yy}" x2="${mx + wl / 2}" y2="${yy}" stroke="${WALL}" stroke-width="${W_FUR}"/><line x1="${mx - wl / 2}" y1="${yy + 0.22}" x2="${mx + wl / 2}" y2="${yy + 0.22}" stroke="${WALL}" stroke-width="${W_FUR}"/>`;
    const winV = (xx: number, my: number) => `<line x1="${xx}" y1="${my - wv / 2}" x2="${xx}" y2="${my + wv / 2}" stroke="${PAPER}" stroke-width="${W_IN * 1.8}"/><line x1="${xx - 0.22}" y1="${my - wv / 2}" x2="${xx - 0.22}" y2="${my + wv / 2}" stroke="${WALL}" stroke-width="${W_FUR}"/><line x1="${xx}" y1="${my - wv / 2}" x2="${xx}" y2="${my + wv / 2}" stroke="${WALL}" stroke-width="${W_FUR}"/><line x1="${xx + 0.22}" y1="${my - wv / 2}" x2="${xx + 0.22}" y2="${my + wv / 2}" stroke="${WALL}" stroke-width="${W_FUR}"/>`;
    if (r.y <= eps) openings.push(winH(cx, 0));
    if (Math.abs(r.y + r.h - H) <= eps) openings.push(winH(cx, H));
    if (r.x <= eps) openings.push(winV(0, cy));
    if (Math.abs(r.x + r.w - W) <= eps) openings.push(winV(W, cy));

    // label (title + dim + area), never overlapping — plate + top-positioned for furnished rooms
    const nameF = Math.max(1.5, Math.min(2.5, Math.min(r.w, r.h) * 0.14));
    if (Math.min(r.w, r.h) > 4) {
      const nx = r.x + r.w / 2 + (r.sub && r.sub[0] ? (r.sub[0].x > r.x ? -r.w * 0.14 : r.w * 0.14) : 0);
      const furnished = ['living', 'kitchen', 'master', 'bedroom', 'guestBedroom', 'dining'].includes(r.type);
      const ny = r.y + (furnished ? r.h * 0.28 : r.h / 2);
      const maxCh = Math.max(4, Math.floor((r.w - 1) / (nameF * 0.58)));
      const raw = L(r.name, hi), nm = esc(raw.length > maxCh ? raw.slice(0, maxCh - 1) + '…' : raw);
      const showDim = Math.min(r.w, r.h) > 7.5, pw = Math.min(r.w - 1, Math.max(nm.length * nameF * 0.58, 6.5));
      const zone = esc(L(r.direction, hi));
      labels.push(`<rect x="${nx - pw / 2}" y="${ny - nameF - 0.2}" width="${pw}" height="${showDim ? nameF + 4.8 : nameF + 1}" rx="0.5" fill="${PAPER}" fill-opacity="0.82"/>
        <text x="${nx}" y="${ny + (showDim ? 0 : nameF * 0.35)}" text-anchor="middle" font-size="${nameF}" font-weight="700" fill="${INK}" font-family="Georgia,serif">${nm}</text>
        ${showDim ? `<text x="${nx}" y="${ny + 2.1}" text-anchor="middle" font-size="1.5" fill="${MUTE}">${ftl(r.w)}×${ftl(r.h)} · ${r.areaSqft} ${hi ? 'वर्गफुट' : 'sqft'}</text>
        <text x="${nx}" y="${ny + 4}" text-anchor="middle" font-size="1.4" font-weight="600" fill="#b8860b">◈ ${zone}</text>` : ''}`);
    }
    (r.sub || []).forEach((sb) => { if (Math.min(sb.w, sb.h) > 3.5) labels.push(`<text x="${sb.x + sb.w / 2}" y="${sb.y + sb.h / 2 + 0.5}" text-anchor="middle" font-size="1.3" font-weight="600" fill="${INK}">${esc(L(sb.name, hi))}</text>`); });
  });

  // ── outdoor / services in the setback ──
  const svc: string[] = [];
  const inp = bp.input;
  const gx0 = 0, gy0 = -pm.n;   // front (north) margin band
  if (inp.garden !== false) svc.push(`<rect x="${gx0}" y="${gy0 + 0.6}" width="${W}" height="${pm.n - 1.2}" fill="#cfeecb" fill-opacity="0.6" stroke="#8fbf7a" stroke-width="${W_DIM}"/><text x="${W / 2}" y="${gy0 + pm.n * 0.5}" text-anchor="middle" font-size="1.9" fill="#4a7a3a">🌳 ${hi ? 'बगीचा / लॉन' : 'Garden / Lawn'}</text>${[0.2, 0.5, 0.8].map((f) => `<circle cx="${W * f}" cy="${gy0 + pm.n * 0.72}" r="1.4" fill="#7bb168" opacity="0.8"/>`).join('')}`);
  if (inp.parking) svc.push(`<rect x="${-pm.w + 0.6}" y="${-pm.n + 0.6}" width="${pm.w + W * 0.28}" height="${Math.min(pm.n - 1.2, 12)}" fill="#dfe4ee" fill-opacity="0.6" stroke="${PLOTC}" stroke-width="${W_DIM}" stroke-dasharray="1 0.8"/><text x="${-pm.w + (pm.w + W * 0.28) / 2 + 0.3}" y="${-pm.n + 3}" text-anchor="middle" font-size="1.7" fill="#4a5566">🚗 ${hi ? 'पार्किंग' : 'Parking'}</text>`);
  const svcIcon = (cx: number, cy: number, icon: string, lbl: string) => `<circle cx="${cx}" cy="${cy}" r="2" fill="#eaf3fb" stroke="#2980b9" stroke-width="${W_FUR}"/><text x="${cx}" y="${cy + 0.7}" text-anchor="middle" font-size="2">${icon}</text><text x="${cx}" y="${cy + 3.4}" text-anchor="middle" font-size="1.4" fill="#4a5566">${lbl}</text>`;
  if (inp.borewell || inp.tankUnderground) svc.push(svcIcon(W + pm.e * 0.5, -pm.n * 0.5, '◉', hi ? 'बोरवेल' : 'Borewell'));
  if (inp.septic) svc.push(svcIcon(-pm.w * 0.5, H + pm.s * 0.5, '▤', hi ? 'सेप्टिक' : 'Septic'));
  if (inp.rainwater) svc.push(svcIcon(W + pm.e * 0.5, H + pm.s * 0.5, '☂', hi ? 'वर्षाजल' : 'Rainwater'));
  if (inp.tankOverhead) svc.push(svcIcon(-pm.w * 0.5, H * 0.82, '▽', hi ? 'पानी टंकी' : 'Water tank'));
  if (inp.solar) svc.push(svcIcon(W * 0.5, -pm.n * 0.28, '☀', hi ? 'सोलर' : 'Solar'));
  // gate + walkway on the facing side (light paved strip from gate to the main door)
  const gate = hi ? 'गेट' : 'Gate', wk = 3, ee = bp.entrance;
  const walk = `fill="#e7e0cf" fill-opacity="0.7" stroke="${PLOTC}" stroke-width="${W_DIM}"`;
  if (inp.facing === 'E') svc.push(`<rect x="${W}" y="${ee.y1 + 1.6 - wk / 2}" width="${pm.e}" height="${wk}" ${walk}/><line x1="${W + pm.e}" y1="${ee.y1 - 1}" x2="${W + pm.e}" y2="${ee.y1 + 4.2}" stroke="${INK}" stroke-width="${W_IN}"/><text x="${W + pm.e - 0.4}" y="${ee.y1 + 6}" text-anchor="end" font-size="1.5" fill="#4a5566">⊟ ${gate}</text>`);
  else if (inp.facing === 'W') svc.push(`<rect x="${-pm.w}" y="${ee.y1 + 1.6 - wk / 2}" width="${pm.w}" height="${wk}" ${walk}/><line x1="${-pm.w}" y1="${ee.y1 - 1}" x2="${-pm.w}" y2="${ee.y1 + 4.2}" stroke="${INK}" stroke-width="${W_IN}"/><text x="${-pm.w + 0.4}" y="${ee.y1 + 6}" font-size="1.5" fill="#4a5566">⊟ ${gate}</text>`);
  else if (inp.facing === 'N') svc.push(`<rect x="${ee.x1 + 1.6 - wk / 2}" y="${-pm.n}" width="${wk}" height="${pm.n}" ${walk}/><line x1="${ee.x1 - 1}" y1="${-pm.n}" x2="${ee.x1 + 4.2}" y2="${-pm.n}" stroke="${INK}" stroke-width="${W_IN}"/><text x="${ee.x1 + 1.6}" y="${-pm.n - 0.6}" text-anchor="middle" font-size="1.5" fill="#4a5566">⊟ ${gate}</text>`);
  else svc.push(`<rect x="${ee.x1 + 1.6 - wk / 2}" y="${H}" width="${wk}" height="${pm.s}" ${walk}/><line x1="${ee.x1 - 1}" y1="${H + pm.s}" x2="${ee.x1 + 4.2}" y2="${H + pm.s}" stroke="${INK}" stroke-width="${W_IN}"/><text x="${ee.x1 + 1.6}" y="${H + pm.s + 1.8}" text-anchor="middle" font-size="1.5" fill="#4a5566">⊟ ${gate}</text>`);

  const mand = mandala ? (() => {
    const zn: [string, string, string][] = [['वायव्य', 'NW', '#c7d2e8'], ['उत्तर', 'N', '#bfe0d0'], ['ईशान', 'NE', '#f2e6a8'], ['पश्चिम', 'W', '#d7cdb0'], ['ब्रह्म', 'C', '#f0d98a'], ['पूर्व', 'E', '#cfe3b8'], ['नैऋत्य', 'SW', '#b8a483'], ['दक्षिण', 'S', '#e6c2a0'], ['आग्नेय', 'SE', '#e9b48f']];
    return `<g>${zn.map((z, i) => { const c = i % 3, rr = Math.floor(i / 3), cw = W / 3, ch = H / 3; return `<rect x="${c * cw}" y="${rr * ch}" width="${cw}" height="${ch}" fill="${z[2]}" fill-opacity="0.16" stroke="#b8860b" stroke-width="${W_DIM}" stroke-dasharray="0.8 0.6"/><text x="${c * cw + cw / 2}" y="${rr * ch + 2}" text-anchor="middle" font-size="1.5" font-weight="700" fill="#7a5a10">${hi ? z[0] : z[1]}</text>`; }).join('')}</g>`;
  })() : '';

  const e = bp.entrance, evert = e.x1 === e.x2, emx = (e.x1 + e.x2) / 2, emy = (e.y1 + e.y2) / 2;
  const entrance = `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="${PAPER}" stroke-width="${W_OUT * 1.4}"/>
    <text x="${evert ? emx + (e.x1 === 0 ? -1 : 1) * 3 : emx}" y="${evert ? emy : emy + (e.y1 === 0 ? -1.2 : 3)}" text-anchor="${evert ? (e.x1 === 0 ? 'end' : 'start') : 'middle'}" font-size="1.8" font-weight="700" fill="#b8860b">⌂ ${esc(L(e.label, hi))}</text>`;

  const dims = `<g stroke="${INK}" stroke-width="${W_DIM}" fill="${INK}">
    <line x1="0" y1="${H + pm.s + 4}" x2="${W}" y2="${H + pm.s + 4}"/><line x1="0" y1="${H + pm.s + 3.2}" x2="0" y2="${H + pm.s + 4.8}"/><line x1="${W}" y1="${H + pm.s + 3.2}" x2="${W}" y2="${H + pm.s + 4.8}"/>
    <text x="${W / 2}" y="${H + pm.s + 6.8}" text-anchor="middle" font-size="2.1" stroke="none">${ftl(W)}</text>
    <line x1="${-pm.w - 4}" y1="0" x2="${-pm.w - 4}" y2="${H}"/><line x1="${-pm.w - 4.8}" y1="0" x2="${-pm.w - 3.2}" y2="0"/><line x1="${-pm.w - 4.8}" y1="${H}" x2="${-pm.w - 3.2}" y2="${H}"/>
    <text x="${-pm.w - 6.4}" y="${H / 2}" text-anchor="middle" font-size="2.1" stroke="none" transform="rotate(-90 ${-pm.w - 6.4} ${H / 2})">${ftl(H)}</text></g>`;

  const cxN = W + EX.r * 0.6, cyN = -pm.n - 5;
  const compass = `<g transform="translate(${cxN} ${cyN})"><circle r="4.2" fill="#fff" stroke="#b8860b" stroke-width="0.22"/><circle r="3" fill="none" stroke="#b8860b" stroke-width="0.08" opacity="0.5"/>
    <polygon points="0,-3.6 -1.1,0.4 0,-0.9 1.1,0.4" fill="#c0392b"/><polygon points="0,3.6 -1.1,-0.4 0,0.9 1.1,-0.4" fill="${WALL}"/>
    <text x="0" y="-4.6" text-anchor="middle" font-size="2" font-weight="700" fill="#c0392b">${hi ? 'उ' : 'N'}</text></g>`;

  const scale = `<g transform="translate(0 ${H + pm.s + 9})"><line x1="0" y1="0" x2="10" y2="0" stroke="${INK}" stroke-width="0.14"/><line x1="0" y1="-0.7" x2="0" y2="0.7" stroke="${INK}" stroke-width="0.1"/><line x1="5" y1="-0.5" x2="5" y2="0.5" stroke="${INK}" stroke-width="0.1"/><line x1="10" y1="-0.7" x2="10" y2="0.7" stroke="${INK}" stroke-width="0.1"/><text x="5" y="2.4" text-anchor="middle" font-size="1.7" fill="${MUTE}">${hi ? '0        10 फुट' : '0        10 ft'}</text></g>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes"/>
<style>html,body{margin:0;padding:0;background:${dark ? '#0a0a0c' : '#fff'};}
.sheet{background:${PAPER};border:1px solid #c9cfda;border-radius:8px;margin:8px;padding:6px;box-shadow:0 5px 20px rgba(0,0,0,0.28);}
svg{width:100%;height:auto;display:block;}
.tb{display:flex;justify-content:space-between;align-items:baseline;font-family:Georgia,serif;color:${INK};padding:3px 8px 5px;border-bottom:1.5px solid ${INK};margin-bottom:3px;}
.tb b{font-size:14px;letter-spacing:0.3px;} .tb span{font-size:10px;color:${MUTE};}</style></head>
<body><div class="sheet">
  <div class="tb"><b>${hi ? 'वास्तु भूतल नक्शा' : 'VASTU FLOOR PLAN'}</b><span>${ftl(W)}×${ftl(H)} · ${hi ? 'मुख' : 'facing'} ${bp.input.facing} · 1:100</span></div>
  <svg viewBox="${-EX.l} ${-EX.t} ${W + EX.l + EX.r} ${H + EX.t + EX.b}" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
    <rect x="${-pm.w}" y="${-pm.n}" width="${PLW}" height="${PLH}" fill="none" stroke="${PLOTC}" stroke-width="${W_IN}" stroke-dasharray="1.6 1.1"/>
    <text x="${-pm.w}" y="${-pm.n - 1.2}" font-size="1.6" fill="${MUTE}">${hi ? `प्लॉट ${ftl(PLW)}×${ftl(PLH)} (सेटबैक सहित)` : `Plot ${ftl(PLW)}×${ftl(PLH)} (with setbacks)`}</text>
    ${svc.join('')}
    <g>${grid}</g>
    ${bodies.join('')}
    ${openings.join('')}
    ${mand}
    ${brahma}
    <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${WALL}" stroke-width="${W_OUT}" stroke-linejoin="miter"/>
    ${entrance}
    ${labels.join('')}
    ${dims}
    ${compass}
    ${scale}
  </svg>
</div></body></html>`;
}
