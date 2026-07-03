/**
 * vastuAscii.ts — render the deterministic Vastu house plan as a clean box-drawing
 * (markdown / monospace) line map. Built from the SAME computed layout as the SVG, so the
 * lines always align and the dimensions are exact — no AI free-hand (which misaligns).
 * The AI layer only EXPLAINS this map, it does not draw it.
 */
import { Blueprint } from './vastuBlueprint';

const L = (o: { en: string; hi: string } | undefined, hi: boolean) => (o ? (hi ? o.hi : o.en) : '');

// box-drawing char by 4-bit mask  U=1 D=2 L=4 R=8
const BOX = [' ', '│', '│', '│', '─', '┘', '┐', '┤', '─', '└', '┌', '├', '─', '┴', '┬', '┼'];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function renderAsciiPlan(bp: Blueprint, hi: boolean): string {
  const COLS = 58;                                   // char columns across the built width
  const sx = COLS / bp.builtW;
  const ROWS = clamp(Math.round(bp.builtL * sx / 2.05), 8, 40); // char rows (chars are ~2× tall)
  const sy = ROWS / bp.builtL;
  const cx = (ft: number) => clamp(Math.round(ft * sx), 0, COLS);
  const cy = (ft: number) => clamp(Math.round(ft * sy), 0, ROWS);

  const hseg: boolean[][] = Array.from({ length: ROWS + 1 }, () => Array(COLS).fill(false));
  const vseg: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS + 1).fill(false));
  const cells: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(' '));

  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    if (x1 <= x0) x1 = x0 + 1;
    if (y1 <= y0) y1 = y0 + 1;
    x1 = Math.min(x1, COLS); y1 = Math.min(y1, ROWS);
    for (let x = x0; x < x1; x += 1) { hseg[y0][x] = true; hseg[y1][x] = true; }
    for (let y = y0; y < y1; y += 1) { vseg[y][x0] = true; vseg[y][x1] = true; }
  };
  const put = (row: number, col: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      const c = col + i;
      if (row >= 0 && row < ROWS && c >= 0 && c < COLS) cells[row][c] = text[i];
    }
  };
  const label = (x0: number, y0: number, x1: number, y1: number, name: string, dim: string) => {
    const w = x1 - x0, h = y1 - y0;
    const mid = Math.floor((y0 + y1) / 2);
    const nm = name.length > w - 1 ? name.slice(0, Math.max(1, w - 1)) : name;
    put(mid, x0 + 1 + Math.max(0, Math.floor((w - 1 - nm.length) / 2)), nm);
    if (h >= 3 && mid + 1 < y1) {
      const dm = dim.length > w - 1 ? dim.slice(0, Math.max(1, w - 1)) : dim;
      put(mid + 1, x0 + 1 + Math.max(0, Math.floor((w - 1 - dm.length) / 2)), dm);
    }
  };

  // outer boundary + every room + nested partitions
  rect(0, 0, COLS, ROWS);
  bp.rooms.forEach((r) => {
    const x0 = cx(r.x), y0 = cy(r.y), x1 = cx(r.x + r.w), y1 = cy(r.y + r.h);
    rect(x0, y0, x1, y1);
    label(x0, y0, x1, y1, L(r.name, hi), `${Math.round(r.w)}x${Math.round(r.h)}`);
    r.sub?.forEach((sb) => {
      const sx0 = cx(sb.x), sy0 = cy(sb.y), sx1 = cx(sb.x + sb.w), sy1 = cy(sb.y + sb.h);
      rect(sx0, sy0, sx1, sy1);
      label(sx0, sy0, sx1, sy1, L(sb.name, hi), `${Math.round(sb.w)}x${Math.round(sb.h)}`);
    });
  });

  // compose
  const lines: string[] = [];
  lines.push(hi ? '            ↑ उत्तर (NORTH)' : '            ↑ NORTH');
  for (let r = 0; r <= ROWS; r += 1) {
    let line = '';
    for (let c = 0; c <= COLS; c += 1) {
      const u = r > 0 && vseg[r - 1][c];
      const d = r < ROWS && vseg[r][c];
      const l = c > 0 && hseg[r][c - 1];
      const rr = c < COLS && hseg[r][c];
      line += BOX[(u ? 1 : 0) | (d ? 2 : 0) | (l ? 4 : 0) | (rr ? 8 : 0)];
      if (c < COLS) line += hseg[r][c] ? '─' : ' ';
    }
    lines.push(line.replace(/\s+$/, ''));
    if (r < ROWS) {
      let cl = '';
      for (let c = 0; c <= COLS; c += 1) {
        cl += vseg[r][c] ? '│' : ' ';
        if (c < COLS) cl += cells[r][c];
      }
      lines.push(cl.replace(/\s+$/, ''));
    }
  }
  return lines.join('\n');
}

/** wrap the plan in a markdown code block + a short legend for copy/share. */
export function asciiPlanMarkdown(bp: Blueprint, hi: boolean): string {
  const head = hi
    ? `# वास्तु नक्शा — निर्माण ${Math.round(bp.builtW)}' × ${Math.round(bp.builtL)}' (मुख — ${bp.input.facing})`
    : `# Vastu Plan — Built ${Math.round(bp.builtW)}' × ${Math.round(bp.builtL)}' (facing ${bp.input.facing})`;
  const note = hi
    ? '\n> वास्तु नियमों से बनाया गया — नैऋत्य में मुख्य शयन, आग्नेय में रसोई, ईशान में पूजा, केंद्र खुला (ब्रह्मस्थान)।'
    : '\n> Generated from Vastu rules — SW master, SE kitchen, NE pooja, open centre (Brahmasthan).';
  return `${head}\n\n\`\`\`\n${renderAsciiPlan(bp, hi)}\n\`\`\`${note}`;
}
