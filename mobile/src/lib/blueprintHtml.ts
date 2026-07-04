/**
 * blueprintHtml.ts — render the deterministic Vastu house plan as a PROFESSIONAL 2D floor
 * plan inside a WebView. Solid black wall-mass with rooms carved out (real wall thickness),
 * detailed top-view furniture, door swings, windows, dimensions, compass — like an
 * architect's drawing. Geometry is 100% from the deterministic engine (no AI free-hand).
 */
import { Blueprint, BpRoom } from './vastuBlueprint';

const L = (o: { en: string; hi: string } | undefined, hi: boolean) => (o ? (hi ? o.hi : o.en) : '');
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ftl = (n: number) => `${Math.round(n)}'`;

const WALL = '#141414';        // wall mass (near-black)
const FUR = '#3a3320';         // furniture line colour
const INK = '#1a1508';
const MUTE = '#7a6640';
const PAPER = '#fbf7ee';
const WT = 0.5;                // half wall thickness (ft) inset per room → shared wall ≈ 1ft

const FILL: Record<string, string> = {
  master: '#bcd4f2', bedroom: '#cbdff6', guestBedroom: '#d6e6f8', kitchen: '#f8d6a2',
  dining: '#f2cfe9', living: '#c6e9c0', bath: '#aee3ec', pooja: '#f8eab0',
  study: '#eaddac', store: '#ded8c0', stairs: '#e6d1b6', parking: '#d2dae6', brahmasthan: '#f7f0d6',
};
const F = (t: string) => FILL[t] || '#e8dfc8';

// ── furniture (drawn in INSET room coords) ──────────────────────────────────
function furniture(r: BpRoom, x: number, y: number, w: number, h: number): string {
  const t = r.type, min = Math.min(w, h);
  if (min < 6) return '';
  const S = `fill="none" stroke="${FUR}" stroke-width="0.16"`;
  const SF = `fill="${FUR}" fill-opacity="0.14" stroke="${FUR}" stroke-width="0.14"`;

  if (t === 'master' || t === 'bedroom' || t === 'guestBedroom') {
    const bw = Math.min(w * 0.62, 7), bh = Math.min(h * 0.55, 6.6);
    const bx = x + 0.7, by = y + h - bh - 0.7;
    return `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="0.4" ${SF}/>
      <rect x="${bx}" y="${by}" width="${bw}" height="0.9" ${S}/>
      <rect x="${bx + 0.5}" y="${by + 1.1}" width="${bw / 2 - 0.9}" height="1.4" rx="0.3" ${S}/>
      <rect x="${bx + bw / 2 + 0.4}" y="${by + 1.1}" width="${bw / 2 - 0.9}" height="1.4" rx="0.3" ${S}/>
      <path d="M${bx} ${by + bh * 0.62} Q ${bx + bw / 2} ${by + bh * 0.5} ${bx + bw} ${by + bh * 0.62}" ${S}/>
      <rect x="${bx - 0.1}" y="${by + bh - 1.6}" width="1.5" height="1.5" ${S}/>
      <rect x="${bx + bw - 1.4}" y="${by + bh - 1.6}" width="1.5" height="1.5" ${S}/>
      <rect x="${x + w - 2}" y="${y + 0.7}" width="1.6" height="${Math.min(h * 0.5, 6)}" ${S}/>
      <line x1="${x + w - 2}" y1="${y + 0.7 + Math.min(h * 0.5, 6) / 2}" x2="${x + w - 0.4}" y2="${y + 0.7 + Math.min(h * 0.5, 6) / 2}" ${S}/>`;
  }
  if (t === 'living') {
    const sy = y + h - 3, sx = x + 0.8, sw = Math.min(w - 4, 8);
    return `
      <rect x="${sx}" y="${sy}" width="${sw}" height="2.4" rx="0.5" ${SF}/>
      <rect x="${sx}" y="${sy - 0.6}" width="${sw}" height="0.8" ${S}/>
      <line x1="${sx + sw / 3}" y1="${sy}" x2="${sx + sw / 3}" y2="${sy + 2.4}" ${S}/><line x1="${sx + 2 * sw / 3}" y1="${sy}" x2="${sx + 2 * sw / 3}" y2="${sy + 2.4}" ${S}/>
      <rect x="${sx + sw + 0.6}" y="${sy - 2.8}" width="2.4" height="2.6" rx="0.4" ${SF}/>
      <rect x="${sx + sw / 2 - 1.6}" y="${sy - 3.6}" width="3.2" height="1.6" rx="0.3" ${S}/>
      <rect x="${x + w / 2 - 3}" y="${y + 0.7}" width="6" height="0.8" ${SF}/>`;
  }
  if (t === 'kitchen') {
    return `
      <rect x="${x + 0.6}" y="${y + 0.6}" width="${w - 1.2}" height="2" ${SF}/>
      <rect x="${x + 0.6}" y="${y + 0.6}" width="2" height="${h - 1.2}" ${SF}/>
      <rect x="${x + w * 0.34}" y="${y + 0.9}" width="2.2" height="1.4" ${S}/>
      <circle cx="${x + w * 0.34 + 0.6}" cy="${y + 1.6}" r="0.35" ${S}/><circle cx="${x + w * 0.34 + 1.6}" cy="${y + 1.6}" r="0.35" ${S}/>
      <circle cx="${x + w * 0.34 + 0.6}" cy="${y + 1.6 + 0}" r="0.35" ${S}/>
      <circle cx="${x + 1.6}" cy="${y + h * 0.5}" r="0.7" ${S}/>
      <rect x="${x + w - 2.6}" y="${y + h - 3}" width="2" height="2.6" ${S}/><line x1="${x + w - 2.6}" y1="${y + h - 1.7}" x2="${x + w - 0.6}" y2="${y + h - 1.7}" ${S}/>`;
  }
  if (t === 'dining') {
    const cx = x + w / 2, cy = y + h / 2, rw = Math.min(w * 0.42, 5), rh = Math.min(h * 0.32, 3.4);
    let ch = '';
    for (let i = 0; i < 3; i++) { const px = cx - rw / 2 + rw * (i + 0.5) / 3; ch += `<rect x="${px - 0.7}" y="${cy - rh / 2 - 1.4}" width="1.4" height="1" rx="0.2" ${S}/><rect x="${px - 0.7}" y="${cy + rh / 2 + 0.4}" width="1.4" height="1" rx="0.2" ${S}/>`; }
    return `<rect x="${cx - rw / 2}" y="${cy - rh / 2}" width="${rw}" height="${rh}" rx="0.5" ${SF}/>${ch}`;
  }
  if (t === 'bath') {
    return `
      <rect x="${x + 0.5}" y="${y + 0.5}" width="1.7" height="2.4" rx="0.4" ${S}/><ellipse cx="${x + 1.35}" cy="${y + 1.5}" rx="0.55" ry="0.75" ${S}/>
      <rect x="${x + w - 2.2}" y="${y + 0.5}" width="1.7" height="1.2" rx="0.3" ${S}/><circle cx="${x + w - 1.35}" cy="${y + 1.1}" r="0.5" ${S}/>
      <rect x="${x + w - 2.4}" y="${y + h - 2.4}" width="1.9" height="1.9" ${S}/><line x1="${x + w - 2.4}" y1="${y + h - 2.4}" x2="${x + w - 0.5}" y2="${y + h - 0.5}" ${S}/>`;
  }
  if (t === 'pooja') { const cx = x + w / 2; return `<rect x="${cx - 1.6}" y="${y + h - 3}" width="3.2" height="2.4" ${SF}/><polygon points="${cx},${y + 0.6} ${cx - 2},${y + h - 3} ${cx + 2},${y + h - 3}" ${S}/><line x1="${cx}" y1="${y + h - 3}" x2="${cx}" y2="${y + h - 1.6}" ${S}/>`; }
  if (t === 'stairs') { let ln = ''; const n = 6, st = (h - 1.4) / n; for (let i = 0; i <= n; i++) ln += `<line x1="${x + 0.6}" y1="${y + 0.7 + i * st}" x2="${x + w - 0.6}" y2="${y + 0.7 + i * st}" ${S}/>`; return `${ln}<line x1="${x + w / 2}" y1="${y + 0.9}" x2="${x + w / 2}" y2="${y + h - 1.2}" stroke="${FUR}" stroke-width="0.12"/><polygon points="${x + w / 2},${y + h - 0.7} ${x + w / 2 - 0.5},${y + h - 1.5} ${x + w / 2 + 0.5},${y + h - 1.5}" fill="${FUR}"/>`; }
  if (t === 'parking') { const cw = Math.min(w * 0.55, 6), c2 = Math.min(h * 0.42, 3.4), cx = x + (w - cw) / 2, cy = y + (h - c2) / 2; return `<rect x="${cx}" y="${cy}" width="${cw}" height="${c2}" rx="1.1" ${S}/><rect x="${cx + cw * 0.18}" y="${cy + 0.4}" width="${cw * 0.64}" height="${c2 * 0.42}" rx="0.4" ${S}/><circle cx="${cx + cw * 0.24}" cy="${cy + c2}" r="0.55" fill="${FUR}"/><circle cx="${cx + cw * 0.76}" cy="${cy + c2}" r="0.55" fill="${FUR}"/>`; }
  if (t === 'study') return `<rect x="${x + 0.6}" y="${y + 0.6}" width="${Math.min(w * 0.6, 5)}" height="1.7" ${SF}/><rect x="${x + w * 0.22}" y="${y + 2.6}" width="1.5" height="1.5" rx="0.3" ${S}/>`;
  return '';
}

/** Readable text summary (for share) — accurate, not ASCII art. */
export function planTextSummary(bp: Blueprint, hi: boolean): string {
  const head = hi
    ? `🏠 वास्तु नक्शा — निर्माण ${ftl(bp.builtW)} × ${ftl(bp.builtL)}, मुख ${bp.input.facing}`
    : `🏠 Vastu Plan — Built ${ftl(bp.builtW)} × ${ftl(bp.builtL)}, facing ${bp.input.facing}`;
  const rows = bp.rooms.map((r) => {
    const sub = (r.sub || []).map((sb) => `\n     • ${L(sb.name, hi)} (${ftl(sb.w)}×${ftl(sb.h)})`).join('');
    return `• ${L(r.name, hi)} — ${L(r.direction, hi)} · ${ftl(r.w)}×${ftl(r.h)} · ${r.areaSqft} sq ft${sub}`;
  }).join('\n');
  const note = hi ? '\n\nवास्तु नियमों से: नैऋत्य में मुख्य शयन, आग्नेय में रसोई, ईशान में पूजा, केंद्र खुला।'
    : '\n\nBy Vastu rules: SW master, SE kitchen, NE pooja, open centre.';
  return `${head}\n\n${rows}${note}`;
}

export function blueprintHtml(bp: Blueprint, hi: boolean, dark: boolean, mandala = false): string {
  const W = bp.builtW, H = bp.builtL;
  const M = { l: Math.max(7, W * 0.14), r: Math.max(9, W * 0.16), t: 12, b: 16 };
  const bcx = W / 2, bcy = H / 2;

  const bodies: string[] = [];
  const openings: string[] = [];
  const labels: string[] = [];

  bp.rooms.forEach((r) => {
    const open = r.type === 'brahmasthan';
    const ix = r.x + WT, iy = r.y + WT, iw = Math.max(1, r.w - 2 * WT), ih = Math.max(1, r.h - 2 * WT);
    // carved room (floor)
    bodies.push(`<g id="${r.id}"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${F(r.type)}" fill-opacity="${open ? 0.4 : 0.9}"/>${open ? '' : furniture(r, ix, iy, iw, ih)}</g>`);

    // attached-bath / utility partitions
    (r.sub || []).forEach((sb) => {
      const sf = sb.type === 'bath' ? F('bath') : '#d3ccae';
      bodies.push(`<rect x="${sb.x + WT}" y="${sb.y + WT}" width="${Math.max(1, sb.w - 2 * WT)}" height="${Math.max(1, sb.h - 2 * WT)}" fill="${sf}"/>`);
      // wall between sub and parent room shows automatically (WALL mass under)
    });

    // door opening (light gap through the wall) + swing arc, facing the centre
    if (!open) {
      const dxc = bcx - (r.x + r.w / 2), dyc = bcy - (r.y + r.h / 2);
      const horiz = Math.abs(dxc) > Math.abs(dyc);
      const dw = Math.min(3, Math.max(2.4, Math.min(r.w, r.h) * 0.32));
      if (horiz) {
        const wx = dxc > 0 ? r.x + r.w - WT : r.x - WT, my = r.y + r.h / 2;
        openings.push(`<rect x="${wx}" y="${my - dw / 2}" width="${2 * WT}" height="${dw}" fill="${F(r.type)}"/>
          <path d="M${dxc > 0 ? r.x + r.w : r.x} ${my - dw / 2} A ${dw} ${dw} 0 0 ${dxc > 0 ? 1 : 0} ${(dxc > 0 ? r.x + r.w : r.x) + (dxc > 0 ? -dw : dw)} ${my + dw / 2}" fill="none" stroke="${MUTE}" stroke-width="0.13"/>`);
      } else {
        const wy = dyc > 0 ? r.y + r.h - WT : r.y - WT, mx = r.x + r.w / 2;
        openings.push(`<rect x="${mx - dw / 2}" y="${wy}" width="${dw}" height="${2 * WT}" fill="${F(r.type)}"/>
          <path d="M${mx - dw / 2} ${dyc > 0 ? r.y + r.h : r.y} A ${dw} ${dw} 0 0 ${dyc > 0 ? 0 : 1} ${mx + dw / 2} ${(dyc > 0 ? r.y + r.h : r.y) + (dyc > 0 ? -dw : dw)}" fill="none" stroke="${MUTE}" stroke-width="0.13"/>`);
      }
    }

    // window notches on exterior walls (light gap + double tick)
    const eps = 0.2, cx = r.x + r.w / 2, cy = r.y + r.h / 2, wl = Math.min(4, r.w * 0.4), wv = Math.min(4, r.h * 0.4);
    const winH = (mx: number, yy: number) => `<rect x="${mx - wl / 2}" y="${yy - WT}" width="${wl}" height="${2 * WT}" fill="${PAPER}"/><line x1="${mx - wl / 2}" y1="${yy}" x2="${mx + wl / 2}" y2="${yy}" stroke="${WALL}" stroke-width="0.12"/>`;
    const winV = (xx: number, my: number) => `<rect x="${xx - WT}" y="${my - wv / 2}" width="${2 * WT}" height="${wv}" fill="${PAPER}"/><line x1="${xx}" y1="${my - wv / 2}" x2="${xx}" y2="${my + wv / 2}" stroke="${WALL}" stroke-width="0.12"/>`;
    if (!open) {
      if (r.y <= eps) openings.push(winH(cx, 0));
      if (Math.abs(r.y + r.h - H) <= eps) openings.push(winH(cx, H));
      if (r.x <= eps) openings.push(winV(0, cy));
      if (Math.abs(r.x + r.w - W) <= eps) openings.push(winV(W, cy));
    }

    // label with plate (drawn on top of everything)
    const nameF = Math.max(1.5, Math.min(2.5, Math.min(r.w, r.h) * 0.15));
    if (Math.min(r.w, r.h) > 4) {
      const nx = r.x + r.w / 2 + (r.sub && r.sub[0] ? (r.sub[0].x > r.x ? -r.w * 0.14 : r.w * 0.14) : 0);
      const ny = r.y + (r.type === 'kitchen' || r.type === 'living' ? r.h * 0.32 : r.h / 2);
      const maxCh = Math.max(4, Math.floor((r.w - 1) / (nameF * 0.6)));
      const raw = L(r.name, hi);
      const nm = esc(raw.length > maxCh ? raw.slice(0, maxCh - 1) + '…' : raw);
      const showDim = Math.min(r.w, r.h) > 8;
      const pw = Math.min(r.w - 1, Math.max(nm.length * nameF * 0.6, 6));
      labels.push(`<rect x="${nx - pw / 2}" y="${ny - nameF - 0.3}" width="${pw}" height="${showDim ? nameF + 3.4 : nameF + 1.2}" rx="0.6" fill="${PAPER}" fill-opacity="0.82"/>
        <text x="${nx}" y="${ny + (showDim ? 0 : nameF * 0.35)}" text-anchor="middle" font-size="${nameF}" font-weight="700" fill="${INK}" font-family="Georgia,serif">${nm}</text>
        ${showDim ? `<text x="${nx}" y="${ny + 2.4}" text-anchor="middle" font-size="1.55" fill="${MUTE}">${ftl(r.w)}×${ftl(r.h)} · ${r.areaSqft} sqft</text>` : ''}`);
    }
    (r.sub || []).forEach((sb) => { if (Math.min(sb.w, sb.h) > 4) labels.push(`<text x="${sb.x + sb.w / 2}" y="${sb.y + sb.h / 2 + 0.5}" text-anchor="middle" font-size="1.35" font-weight="600" fill="${INK}">${esc(L(sb.name, hi))}</text>`); });
  });

  const mand = mandala ? (() => {
    const zn: [string, string, string][] = [['वायव्य', 'NW', '#c7d2e8'], ['उत्तर', 'N', '#bfe0d0'], ['ईशान', 'NE', '#f2e6a8'], ['पश्चिम', 'W', '#d7cdb0'], ['ब्रह्म', 'C', '#f0d98a'], ['पूर्व', 'E', '#cfe3b8'], ['नैऋत्य', 'SW', '#b8a483'], ['दक्षिण', 'S', '#e6c2a0'], ['आग्नेय', 'SE', '#e9b48f']];
    return `<g>${zn.map((z, i) => { const c = i % 3, rr = Math.floor(i / 3); const cw = W / 3, ch = H / 3; return `<rect x="${c * cw}" y="${rr * ch}" width="${cw}" height="${ch}" fill="${z[2]}" fill-opacity="0.2" stroke="#b8860b" stroke-width="0.15" stroke-dasharray="0.8 0.6"/><text x="${c * cw + cw / 2}" y="${rr * ch + 2.2}" text-anchor="middle" font-size="1.6" font-weight="700" fill="#7a5a10">${hi ? z[0] : z[1]}</text>`; }).join('')}</g>`;
  })() : '';

  const e = bp.entrance, evert = e.x1 === e.x2, emx = (e.x1 + e.x2) / 2, emy = (e.y1 + e.y2) / 2;
  const entrance = `<rect x="${evert ? (e.x1 === 0 ? -WT : W - WT) : e.x1}" y="${evert ? emy - 1.6 : (e.y1 === 0 ? -WT : H - WT)}" width="${evert ? 2 * WT : 3.2}" height="${evert ? 3.2 : 2 * WT}" fill="${PAPER}"/>
    <text x="${evert ? emx + (e.x1 === 0 ? -1 : 1) * 3.6 : emx}" y="${evert ? emy : emy + (e.y1 === 0 ? -1.4 : 3.4)}" text-anchor="${evert ? (e.x1 === 0 ? 'end' : 'start') : 'middle'}" font-size="1.9" font-weight="700" fill="#b8860b">⌂ ${esc(L(e.label, hi))}</text>`;

  const markers = bp.markers.map((m) => `<circle cx="${m.x}" cy="${m.y}" r="1.9" fill="#cfe6f5" stroke="#2980b9" stroke-width="0.2"/><text x="${m.x}" y="${m.y + 0.7}" text-anchor="middle" font-size="1.6">💧</text>`).join('');

  const dims = `<g stroke="${INK}" stroke-width="0.14" fill="${INK}">
    <line x1="0" y1="${H + 4}" x2="${W}" y2="${H + 4}"/><line x1="0" y1="${H + 3.2}" x2="0" y2="${H + 4.8}"/><line x1="${W}" y1="${H + 3.2}" x2="${W}" y2="${H + 4.8}"/>
    <text x="${W / 2}" y="${H + 6.8}" text-anchor="middle" font-size="2.1" stroke="none">${ftl(W)}</text>
    <line x1="-4" y1="0" x2="-4" y2="${H}"/><line x1="-4.8" y1="0" x2="-3.2" y2="0"/><line x1="-4.8" y1="${H}" x2="-3.2" y2="${H}"/>
    <text x="-6.2" y="${H / 2}" text-anchor="middle" font-size="2.1" stroke="none" transform="rotate(-90 -6.2 ${H / 2})">${ftl(H)}</text></g>`;

  const cxN = W + M.r * 0.5, cyN = -M.t * 0.5;
  const compass = `<g transform="translate(${cxN} ${cyN})"><circle r="4" fill="#fff" stroke="#b8860b" stroke-width="0.2"/><polygon points="0,-3.4 -1,0 0,-1 1,0" fill="#c0392b"/><polygon points="0,3.4 -1,0 0,1 1,0" fill="${WALL}"/><text x="0" y="-4.4" text-anchor="middle" font-size="2" font-weight="700" fill="#c0392b">${hi ? 'उ' : 'N'}</text></g>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes"/>
<style>
  html,body{margin:0;padding:0;background:${dark ? '#0a0a06' : '#fff'};}
  .sheet{background:${PAPER};border:2px solid ${WALL};border-radius:10px;margin:8px;padding:6px;box-shadow:0 6px 22px rgba(0,0,0,0.3);}
  svg{width:100%;height:auto;display:block;}
  .tb{display:flex;justify-content:space-between;align-items:center;font-family:Georgia,serif;color:${INK};padding:4px 8px 3px;border-bottom:1px solid #d8caa0;margin-bottom:2px;}
  .tb b{font-size:14px;} .tb span{font-size:10px;color:${MUTE};}
</style></head><body><div class="sheet">
  <div class="tb"><b>${hi ? 'वास्तु भूतल नक्शा' : 'Vastu Floor Plan'}</b><span>${ftl(W)}×${ftl(H)} · ${hi ? 'मुख' : 'facing'} ${bp.input.facing}</span></div>
  <svg viewBox="${-M.l} ${-M.t} ${W + M.l + M.r} ${H + M.t + M.b}" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
    <rect x="${-WT}" y="${-WT}" width="${W + 2 * WT}" height="${H + 2 * WT}" fill="${WALL}"/>
    ${bodies.join('')}
    ${openings.join('')}
    ${mand}
    ${entrance}
    ${markers}
    <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${WALL}" stroke-width="0.5"/>
    ${labels.join('')}
    ${dims}
    ${compass}
  </svg>
</div></body></html>`;
}
