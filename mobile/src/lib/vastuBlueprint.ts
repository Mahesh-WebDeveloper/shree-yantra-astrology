/**
 * vastuBlueprint.ts — deterministic Vastu house-plan layout engine (NO AI, pure rules).
 *
 * Clean 3×3 Vastu grid: every one of the 9 zones is assigned exactly one room, laid out in
 * 3 horizontal bands (North / Centre / South). Band heights are content-weighted and each
 * band's rooms tile the full width (the last room fills the remainder) — so the plan ALWAYS
 * tiles perfectly with shared walls, no gaps, no leftover strips, no overlaps.
 *
 * Classical placement (Mayamata / Manasara / Brihat Samhita):
 *   SW master · SE kitchen · N living · NE pooja · centre open hall (Brahmasthan) ·
 *   NW guest/bath/parking · W dining · E study/bedroom · S store/stairs.
 * All maths in FEET.
 */

export type Bi = { en: string; hi: string };
export type Facing = 'N' | 'E' | 'S' | 'W';
export type ZoneKey = 'NW' | 'N' | 'NE' | 'W' | 'C' | 'E' | 'SW' | 'S' | 'SE';

export interface BlueprintInput {
  plotW?: number | null; plotL?: number | null;
  builtW: number; builtL: number;
  facing: Facing;
  bedrooms: number; bathrooms: number;
  pooja: boolean; dining: boolean; study: boolean; store: boolean;
  staircase: boolean; parking: boolean; tankOverhead: boolean; tankUnderground: boolean;
  garden?: boolean; borewell?: boolean; septic?: boolean; rainwater?: boolean; solar?: boolean;
  customSizes?: Record<string, { w: number; h: number }>;
}

export interface SubRoom { type: string; name: Bi; x: number; y: number; w: number; h: number }
export interface BpRoom {
  id: string; type: string; name: Bi; zone: ZoneKey;
  x: number; y: number; w: number; h: number;
  cell: { x: number; y: number; w: number; h: number };
  color: string;
  direction: Bi; areaSqft: number; vastuScore: number;
  reason: Bi; tip: Bi; sub?: SubRoom[]; editable: boolean;
}
export interface BpMarker { id: string; kind: 'tank-overhead' | 'tank-underground'; x: number; y: number; label: Bi }
export interface Blueprint {
  input: BlueprintInput;
  plotW: number; plotL: number; builtW: number; builtL: number;
  offX: number; offY: number; margins: { n: number; s: number; e: number; w: number };
  rooms: BpRoom[]; markers: BpMarker[];
  entrance: { x1: number; y1: number; x2: number; y2: number; label: Bi; zoneNote: Bi };
  notes: Bi[];
}

const N = (en: string, hi: string): Bi => ({ en, hi });
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const r1 = (v: number) => Math.round(v * 10) / 10;

const DIR_LABEL: Record<ZoneKey, Bi> = {
  NW: N('North-West', 'वायव्य (उ-प)'), N: N('North', 'उत्तर'), NE: N('North-East', 'ईशान (उ-पू)'),
  W: N('West', 'पश्चिम'), C: N('Centre', 'ब्रह्मस्थान'), E: N('East', 'पूर्व'),
  SW: N('South-West', 'नैऋत्य (द-प)'), S: N('South', 'दक्षिण'), SE: N('South-East', 'आग्नेय (द-पू)'),
};

const ROOM_META: Record<string, { name: Bi; color: string; score: number; reason: Bi; tip: Bi }> = {
  master: { name: N('Master Bedroom', 'मुख्य शयन कक्ष'), color: '#7fa8d8', score: 97, reason: N('South-West is the heaviest, most stable corner — ideal for the head of the family.', 'नैऋत्य (द-प) सबसे भारी व स्थिर कोना है — घर के मुखिया के लिए सर्वोत्तम।'), tip: N('Sleep with the head toward South or East.', 'सिर दक्षिण या पूर्व की ओर रखें।') },
  bedroom: { name: N('Bedroom', 'शयन कक्ष'), color: '#9fc2e8', score: 90, reason: N('South and West sides suit bedrooms — restful, away from the active North-East.', 'दक्षिण/पश्चिम की ओर शयन कक्ष शुभ — विश्राम के लिए शांत क्षेत्र।'), tip: N('Head toward South/East while sleeping.', 'सोते समय सिर दक्षिण/पूर्व।') },
  guestBedroom: { name: N('Guest Bedroom', 'अतिथि कक्ष'), color: '#b2cdec', score: 86, reason: N('North-West (Vayu) suits guests — comfortable but naturally transient.', 'वायव्य (उ-प) अतिथियों हेतु उत्तम।'), tip: N('Keep it airy.', 'हवादार रखें।') },
  kitchen: { name: N('Kitchen', 'रसोई'), color: '#e6a856', score: 98, reason: N('South-East is the Agni (fire) corner — the classical place for cooking.', 'आग्नेय (द-पू) अग्नि कोण है — रसोई का शास्त्रीय स्थान।'), tip: N('Cook facing East; gas in SE, sink toward NE.', 'भोजन बनाते समय मुँह पूर्व; गैस आग्नेय, सिंक ईशान की ओर।') },
  pooja: { name: N('Pooja Room', 'पूजा घर'), color: '#ecd982', score: 99, reason: N('North-East (Ishan) is the most sacred, lightest corner — best for worship.', 'ईशान (उ-पू) सबसे पवित्र व हल्का कोना — पूजा हेतु सर्वश्रेष्ठ।'), tip: N('Face East/North while praying.', 'पूजा करते समय मुँह पूर्व/उत्तर।') },
  bath: { name: N('Bathroom', 'शौचालय'), color: '#8fc6d0', score: 84, reason: N('North-West or South placement keeps drains away from the sacred North-East.', 'वायव्य/दक्षिण में शौचालय — पवित्र ईशान से दूर।'), tip: N('Never in the NE or centre.', 'ईशान या केंद्र में कभी नहीं।') },
  living: { name: N('Living Room', 'बैठक कक्ष'), color: '#9bce93', score: 94, reason: N('North is open and welcoming — ideal for the family to gather.', 'उत्तर खुला व स्वागतमय क्षेत्र — बैठक हेतु आदर्श।'), tip: N('Keep North & East lighter.', 'उत्तर व पूर्व हल्का रखें।') },
  dining: { name: N('Dining', 'भोजन कक्ष'), color: '#d9a6d0', score: 88, reason: N('West dining near the kitchen supports calm meals.', 'पश्चिम में भोजन कक्ष — रसोई के पास शुभ।'), tip: N('Sit facing East/North.', 'भोजन करते समय मुँह पूर्व/उत्तर।') },
  study: { name: N('Study', 'अध्ययन कक्ष'), color: '#cdbf84', score: 90, reason: N('East study benefits from morning light and focus.', 'पूर्व में अध्ययन — प्रातः प्रकाश व एकाग्रता।'), tip: N('Face East/North while studying.', 'पढ़ते समय मुँह पूर्व/उत्तर।') },
  store: { name: N('Store', 'भंडार कक्ष'), color: '#bcb89e', score: 85, reason: N('South/South-West storage adds weight where Vastu wants it heavy.', 'दक्षिण/नैऋत्य में भंडार शुभ।'), tip: N('Store heavy/grain items here.', 'भारी/अनाज यहाँ रखें।') },
  stairs: { name: N('Staircase', 'सीढ़ियाँ'), color: '#c9ac8c', score: 86, reason: N('South/South-West stairs keep the heavy structure in the heavy zone.', 'दक्षिण/नैऋत्य में सीढ़ियाँ।'), tip: N('Climb clockwise; keep out of centre & NE.', 'घड़ी की दिशा में; केंद्र व ईशान से दूर।') },
  parking: { name: N('Parking', 'पार्किंग'), color: '#adbbc9', score: 82, reason: N('North-West suits vehicles — the zone of movement (Vayu).', 'वायव्य वाहन हेतु उत्तम।'), tip: N('Park facing out (North/East).', 'वाहन का मुँह बाहर (उत्तर/पूर्व)।') },
  brahmasthan: { name: N('Central Hall', 'केंद्रीय हॉल') /* Brahmasthan */, color: '#f0e7ca', score: 100, reason: N('The centre is kept open and light — the heart of the home (Brahmasthan).', 'केंद्र खुला व हल्का रहे — यही घर का हृदय (ब्रह्मस्थान) है।'), tip: N('Keep this zone clear of heavy columns & toilets.', 'इस क्षेत्र को भारी खंभों व शौचालय से मुक्त रखें।') },
};

const IDEAL: Record<string, number> = {
  master: 195, bedroom: 155, guestBedroom: 140, kitchen: 105, dining: 120, living: 215,
  study: 100, bath: 45, pooja: 50, store: 60, stairs: 68, parking: 190, brahmasthan: 135,
};
const POS: Record<ZoneKey, { band: 0 | 1 | 2; pos: 0 | 1 | 2 }> = {
  NW: { band: 0, pos: 0 }, N: { band: 0, pos: 1 }, NE: { band: 0, pos: 2 },
  W: { band: 1, pos: 0 }, C: { band: 1, pos: 1 }, E: { band: 1, pos: 2 },
  SW: { band: 2, pos: 0 }, S: { band: 2, pos: 1 }, SE: { band: 2, pos: 2 },
};

function fitWidths(ideals: number[], total: number, min: number): number[] {
  const sum = ideals.reduce((a, b) => a + b, 0) || 1;
  const w = ideals.map((v) => (total * v) / sum);
  const deficit = w.reduce((a, x) => a + Math.max(0, min - x), 0);
  if (deficit > 0) {
    const big = w.filter((x) => x > min).reduce((a, x) => a + x, 0);
    return w.map((x) => (x < min ? min : big > deficit ? x - (deficit * x) / big : x));
  }
  return w;
}

export function buildBlueprint(inp: BlueprintInput): Blueprint {
  const builtW = Math.max(15, inp.builtW), builtL = Math.max(15, inp.builtL);
  const plotW = Math.max(builtW, Number(inp.plotW) || builtW), plotL = Math.max(builtL, Number(inp.plotL) || builtL);
  const freeW = plotW - builtW, freeL = plotL - builtL;
  const margins = { w: Math.round(freeW * 0.35), e: Math.round(freeW * 0.65), n: Math.round(freeL * 0.65), s: Math.round(freeL * 0.35) };

  const beds = clamp(inp.bedrooms, 1, 5);
  const baths = clamp(inp.bathrooms, 0, 3);
  const attachN = Math.min(baths, beds);
  const commonBaths = Math.max(0, baths - attachN);

  // ── assign a room type to every one of the 9 zones ──
  const z = {} as Record<ZoneKey, string>;
  z.SW = 'master'; z.SE = 'kitchen'; z.N = 'living'; z.C = 'brahmasthan';
  const fillZones: ZoneKey[] = ['NW', 'W', 'E', 'S'];
  if (inp.pooja) z.NE = 'pooja'; else fillZones.push('NE');

  const demand: string[] = [];
  for (let i = 1; i < beds; i += 1) demand.push('bedroom');
  if (inp.dining) demand.push('dining');
  for (let i = 0; i < commonBaths; i += 1) demand.push('bath');
  if (inp.study) demand.push('study');
  if (inp.store) demand.push('store');
  if (inp.staircase) demand.push('stairs');
  if (inp.parking && freeW + freeL <= 0) demand.push('parking');
  const pref: Record<string, ZoneKey[]> = {
    bedroom: ['NW', 'E', 'S', 'NE'], dining: ['W', 'E'], bath: ['NW', 'S', 'E', 'NE'],
    study: ['E', 'W', 'NE'], store: ['S', 'NW', 'NE'], stairs: ['S'], parking: ['NW'],
  };
  demand.forEach((t) => {
    const zone = (pref[t] || fillZones).find((zz) => fillZones.includes(zz) && !z[zz]) || fillZones.find((zz) => !z[zz]);
    if (zone) z[zone] = t;
  });
  fillZones.forEach((zz) => { if (!z[zz]) z[zz] = 'store'; }); // guarantee every zone filled → clean tiling

  // group into 3 bands, ordered W→E
  const bands: { zone: ZoneKey; type: string }[][] = [[], [], []];
  (Object.keys(z) as ZoneKey[]).forEach((zone) => bands[POS[zone].band].push({ zone, type: z[zone] }));
  bands.forEach((b) => b.sort((a, c) => POS[a.zone].pos - POS[c.zone].pos));

  // band heights (content-weighted, clamped) → tile builtL exactly
  const rowIdeal = bands.map((b) => b.reduce((s, r) => s + (IDEAL[r.type] || 100), 0) || 1);
  const sumRow = rowIdeal.reduce((a, b) => a + b, 0);
  let rowH = rowIdeal.map((v) => (builtL * v) / sumRow).map((h) => clamp(h, builtL * 0.27, builtL * 0.4));
  const hs = rowH.reduce((a, b) => a + b, 0);
  rowH = rowH.map((h) => (h * builtL) / hs);

  const rooms: BpRoom[] = [];
  let bedNo = 1;
  let y = 0;
  bands.forEach((band, bi) => {
    const h = rowH[bi];
    const widths = fitWidths(band.map((r) => IDEAL[r.type] || 100), builtW, Math.min(9, builtW / band.length));
    let x = 0;
    band.forEach((r, i) => {
      const w = i === band.length - 1 ? builtW - x : r1(widths[i]);
      const meta = ROOM_META[r.type];
      let name = meta.name;
      if (r.type === 'bedroom') { bedNo += 1; name = N(`Bedroom ${bedNo}`, `शयन कक्ष ${bedNo}`); }
      rooms.push({
        id: `${r.zone}-${r.type}`, type: r.type, name, zone: r.zone,
        x: r1(x), y: r1(y), w: r1(w), h: r1(h), cell: { x: r1(x), y: r1(y), w: r1(w), h: r1(h) },
        color: meta.color, direction: DIR_LABEL[r.zone], areaSqft: Math.round(w * h),
        vastuScore: meta.score, reason: meta.reason, tip: meta.tip, editable: r.type !== 'brahmasthan',
      });
      x += w;
    });
    y += h;
  });

  // ── attached baths in bedrooms + utility in kitchen (nested) ──
  const carve = (parent: BpRoom, type: string, name: Bi, ftW: number, ftH: number) => {
    const sw = Math.min(ftW, parent.w * 0.44), sh = Math.min(ftH, parent.h * 0.48);
    if (sw < 4 || sh < 4) return;
    const iRight = parent.x + parent.w / 2 < builtW / 2, iUp = parent.y + parent.h / 2 > builtL / 2;
    parent.sub = [...(parent.sub || []), {
      type, name,
      x: r1(iRight ? parent.x + parent.w - sw : parent.x),
      y: r1(iUp ? parent.y : parent.y + parent.h - sh), w: r1(sw), h: r1(sh),
    }];
  };
  const bedrooms = rooms.filter((r) => r.type === 'master' || r.type === 'bedroom' || r.type === 'guestBedroom');
  bedrooms.slice(0, attachN).forEach((br) => carve(br, 'bath', N('Attached Bath', 'संलग्न स्नान'), 7, 5.5));
  const kitchen = rooms.find((r) => r.type === 'kitchen');
  if (kitchen && kitchen.w >= 12 && kitchen.h >= 12) carve(kitchen, 'utility', N('Utility', 'यूटिलिटी'), 5.5, 5.5);

  // ── entrance on the facing edge ──
  const seg = clamp(builtW * 0.09, 2.6, 3.6);
  let entrance: Blueprint['entrance'];
  if (inp.facing === 'N') entrance = { x1: builtW * 0.58, y1: 0, x2: builtW * 0.58 + seg, y2: 0, label: N('Main Door (N)', 'मुख्य द्वार (उ)'), zoneNote: N('North entrance toward the NE pada.', 'उत्तर प्रवेश — ईशान की ओर।') };
  else if (inp.facing === 'E') entrance = { x1: builtW, y1: builtL * 0.24, x2: builtW, y2: builtL * 0.24 + seg, label: N('Main Door (E)', 'मुख्य द्वार (पू)'), zoneNote: N('East entrance — morning sunlight enters.', 'पूर्व प्रवेश — प्रातः सूर्य प्रकाश।') };
  else if (inp.facing === 'S') entrance = { x1: builtW * 0.6, y1: builtL, x2: builtW * 0.6 + seg, y2: builtL, label: N('Main Door (S)', 'मुख्य द्वार (द)'), zoneNote: N('South entrance toward the SE pada.', 'दक्षिण प्रवेश — आग्नेय की ओर।') };
  else entrance = { x1: 0, y1: builtL * 0.26, x2: 0, y2: builtL * 0.26 + seg, label: N('Main Door (W)', 'मुख्य द्वार (प)'), zoneNote: N('West entrance toward the NW pada.', 'पश्चिम प्रवेश — वायव्य की ओर।') };

  const markers: BpMarker[] = [];
  if (inp.tankOverhead) markers.push({ id: 'oh', kind: 'tank-overhead', x: builtW * 0.14, y: builtL * 0.9, label: N('Overhead tank (SW)', 'टंकी — छत, नैऋत्य') });
  if (inp.tankUnderground) markers.push({ id: 'ug', kind: 'tank-underground', x: builtW * 0.88, y: builtL * 0.1, label: N('Underground water (NE)', 'भूमिगत जल — ईशान') });

  const notes: Bi[] = [
    N('North & East are kept lighter; heavy rooms sit toward the South-West.', 'उत्तर व पूर्व हल्के; भारी कमरे नैऋत्य की ओर।'),
    N('The centre (Brahmasthan) is the open central hall.', 'केंद्र (ब्रह्मस्थान) खुला केंद्रीय हॉल है।'),
    entrance.zoneNote,
  ];

  return { input: { ...inp, builtW, builtL }, plotW, plotL, builtW, builtL, offX: margins.w, offY: margins.n, margins, rooms, markers, entrance, notes };
}

export function resizeRoom(bp: Blueprint, roomId: string, newW: number, newH: number): Blueprint {
  const rooms = bp.rooms.map((r) => {
    if (r.id !== roomId) return r;
    const w = Math.max(4, Math.min(r.cell.w, newW)), h = Math.max(4, Math.min(r.cell.h, newH));
    const col = POS[r.zone].pos, row = POS[r.zone].band;
    const x = col === 0 ? r.cell.x : col === 2 ? r.cell.x + r.cell.w - w : r.cell.x + (r.cell.w - w) / 2;
    const yy = row === 0 ? r.cell.y : row === 2 ? r.cell.y + r.cell.h - h : r.cell.y + (r.cell.h - h) / 2;
    return { ...r, x: r1(x), y: r1(yy), w: r1(w), h: r1(h), areaSqft: Math.round(w * h) };
  });
  return { ...bp, rooms };
}
