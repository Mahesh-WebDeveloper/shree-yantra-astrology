/**
 * vastuBlueprint.ts — deterministic Vastu house-plan layout engine (NO AI, pure rules).
 *
 * Space-planning model: rooms are assigned to their classical Vastu zone, then packed as
 * PROPORTIONAL ROW-STRIPS (North band / Centre band / South band). Row heights and room
 * widths are sized from realistic per-type target areas — so a living room is large, a
 * bathroom small, and nothing is an equal box. Non-overlapping by construction.
 *
 * Classical placement (Mayamata / Manasara / Brihat Samhita tradition):
 *   SW master · SE kitchen · NE pooja + underground water · N living · NW guest/bath/
 *   parking · W dining/study · S store/stairs · CENTRE open Brahmasthan.
 * Plot larger than the built area → the block sits toward the South-West so North & East
 * stay more open (traditional rule), shown with labelled setbacks.
 *
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
}

export interface BpRoom {
  id: string; type: string; name: Bi; zone: ZoneKey;
  x: number; y: number; w: number; h: number;          // ft, relative to built top-left (N = top)
  cell: { x: number; y: number; w: number; h: number }; // strip slot (edit clamp)
  color: string;
  direction: Bi; areaSqft: number; vastuScore: number;
  reason: Bi; tip: Bi;
  editable: boolean;
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

const DIR_LABEL: Record<ZoneKey, Bi> = {
  NW: N('North-West', 'वायव्य (उ-प)'), N: N('North', 'उत्तर'), NE: N('North-East', 'ईशान (उ-पू)'),
  W: N('West', 'पश्चिम'), C: N('Centre', 'ब्रह्मस्थान'), E: N('East', 'पूर्व'),
  SW: N('South-West', 'नैऋत्य (द-प)'), S: N('South', 'दक्षिण'), SE: N('South-East', 'आग्नेय (द-पू)'),
};

// realistic target area (sq ft) → drives proportional sizing
const IDEAL_AREA: Record<string, number> = {
  master: 190, bedroom: 155, guestBedroom: 135, kitchen: 105, dining: 125, living: 215,
  study: 95, bath: 42, pooja: 48, store: 55, stairs: 66, parking: 195, veranda: 100, brahmasthan: 130,
};

const ROOM_META: Record<string, { name: Bi; color: string; score: number; reason: Bi; tip: Bi }> = {
  master: { name: N('Master Bedroom', 'मुख्य शयन कक्ष'), color: '#7fa8d8', score: 97, reason: N('South-West is the heaviest, most stable corner — ideal for the head of the family.', 'नैऋत्य (द-प) सबसे भारी व स्थिर कोना है — घर के मुखिया के लिए सर्वोत्तम।'), tip: N('Sleep with the head toward South or East. Keep the SW corner heavy (no mirrors facing the bed).', 'सिर दक्षिण या पूर्व की ओर रखें। नैऋत्य कोना भारी रखें (बिस्तर के सामने दर्पण न हो)।') },
  bedroom: { name: N('Bedroom', 'शयन कक्ष'), color: '#9fc2e8', score: 90, reason: N('South and West sides suit bedrooms — restful, away from the active North-East.', 'दक्षिण/पश्चिम की ओर शयन कक्ष शुभ — विश्राम के लिए शांत क्षेत्र।'), tip: N('Head toward South/East while sleeping; avoid a beam directly overhead.', 'सोते समय सिर दक्षिण/पूर्व; सिर के ठीक ऊपर बीम न हो।') },
  guestBedroom: { name: N('Guest Bedroom', 'अतिथि कक्ष'), color: '#b2cdec', score: 86, reason: N('North-West (Vayu) suits guests — comfortable but naturally transient.', 'वायव्य (उ-प) अतिथियों हेतु उत्तम — सुखद पर अस्थायी भाव का क्षेत्र।'), tip: N('Good for guests who should not overstay; keep it airy.', 'अतिथियों हेतु उत्तम जो अधिक न रुकें; हवादार रखें।') },
  kitchen: { name: N('Kitchen', 'रसोई'), color: '#e6a856', score: 98, reason: N('South-East is the Agni (fire) corner — the classical place for cooking.', 'आग्नेय (द-पू) अग्नि कोण है — रसोई का शास्त्रीय स्थान।'), tip: N('Cook facing East. Keep the gas in the SE, sink toward NE — fire and water apart.', 'भोजन बनाते समय मुँह पूर्व की ओर। गैस आग्नेय में, सिंक ईशान की ओर — अग्नि व जल अलग।') },
  pooja: { name: N('Pooja Room', 'पूजा घर'), color: '#ecd982', score: 99, reason: N('North-East (Ishan) is the most sacred, lightest corner — best for worship.', 'ईशान (उ-पू) सबसे पवित्र व हल्का कोना — पूजा हेतु सर्वश्रेष्ठ।'), tip: N('Face East/North while praying. Keep idols a little away from the wall; keep this corner clean and light.', 'पूजा करते समय मुँह पूर्व/उत्तर। मूर्ति दीवार से थोड़ा हटकर; कोना स्वच्छ व हल्का रखें।') },
  bath: { name: N('Bathroom / Toilet', 'स्नान / शौचालय'), color: '#8fc6d0', score: 84, reason: N('North-West or South placement keeps drains away from the sacred North-East.', 'वायव्य/दक्षिण में शौचालय — पवित्र ईशान से दूर रहता है।'), tip: N('Never in the NE or centre. Keep the door closed; slope the drain toward NW/N.', 'ईशान या केंद्र में कभी नहीं। दरवाज़ा बंद रखें; नाली का ढाल वायव्य/उत्तर की ओर।') },
  living: { name: N('Living Room', 'बैठक'), color: '#9bce93', score: 94, reason: N('North is open and welcoming — ideal for family and guests to gather.', 'उत्तर खुला व स्वागतमय क्षेत्र — बैठक हेतु आदर्श।'), tip: N('Keep the North & East sides lighter (lower furniture); heavy sofas toward South/West.', 'उत्तर व पूर्व की ओर हल्का रखें; भारी सोफ़े दक्षिण/पश्चिम की ओर।') },
  dining: { name: N('Dining Room', 'भोजन कक्ष'), color: '#d9a6d0', score: 88, reason: N('West dining near the kitchen supports calm, satisfying meals.', 'पश्चिम में भोजन कक्ष — रसोई के पास, शांति से भोजन हेतु शुभ।'), tip: N('Sit facing East/North while eating; keep the dining table away from the toilet wall.', 'भोजन करते समय मुँह पूर्व/उत्तर; मेज़ शौचालय की दीवार से दूर।') },
  study: { name: N('Study Room', 'अध्ययन कक्ष'), color: '#cdbf84', score: 90, reason: N('East/West study benefits from morning light and steady focus.', 'पूर्व/पश्चिम में अध्ययन — प्रातः प्रकाश व एकाग्रता हेतु उत्तम।'), tip: N('Face East/North while studying; keep the desk away from the wall by a few inches.', 'पढ़ते समय मुँह पूर्व/उत्तर; मेज़ दीवार से थोड़ी दूर।') },
  store: { name: N('Store Room', 'भंडार कक्ष'), color: '#bcb89e', score: 85, reason: N('South/South-West storage adds weight where Vastu wants it heavy.', 'दक्षिण/नैऋत्य में भंडार — जहाँ भार शुभ है वहीं वज़न बढ़ाता है।'), tip: N('Store heavy/grain items here; keep the NE corner of the home empty instead.', 'भारी/अनाज यहाँ रखें; घर का ईशान कोना खाली रखें।') },
  stairs: { name: N('Staircase', 'सीढ़ियाँ'), color: '#c9ac8c', score: 86, reason: N('South/South-West stairs keep the heavy structure in the heavy zone.', 'दक्षिण/नैऋत्य में सीढ़ियाँ — भारी संरचना भारी क्षेत्र में।'), tip: N('Climb clockwise; keep stairs out of the centre and the NE.', 'सीढ़ियाँ घड़ी की दिशा में चढ़ें; केंद्र व ईशान से दूर रखें।') },
  parking: { name: N('Parking', 'पार्किंग'), color: '#adbbc9', score: 82, reason: N('North-West suits vehicles — the zone of movement (Vayu).', 'वायव्य वाहन हेतु उत्तम — गति (वायु) का क्षेत्र।'), tip: N('Park facing out (North/East). Keep the floor level slightly lower than the house.', 'वाहन का मुँह बाहर (उत्तर/पूर्व); फर्श घर से थोड़ा नीचा रखें।') },
  veranda: { name: N('Veranda / Lobby', 'बरामदा'), color: '#ddcca6', score: 90, reason: N('An open, bright entrance zone welcomes energy into the home.', 'खुला व उज्ज्वल प्रवेश क्षेत्र — घर में सकारात्मक ऊर्जा लाता है।'), tip: N('Keep it clutter-free and well-lit; a threshold (dehli) is auspicious.', 'साफ़ व रोशन रखें; देहली (threshold) शुभ मानी जाती है।') },
  brahmasthan: { name: N('Courtyard (Brahmasthan)', 'आँगन (ब्रह्मस्थान)'), color: '#f0e7ca', score: 100, reason: N('The centre is kept open and light — the heart of the home breathes here.', 'केंद्र खुला व हल्का रहे — यही घर का हृदय है।'), tip: N('Keep the centre free of heavy pillars, toilets and staircases — let it stay open.', 'केंद्र में भारी खंभे, शौचालय व सीढ़ियाँ न हों — इसे खुला रखें।') },
};

const ROW_OF: Record<ZoneKey, 0 | 1 | 2> = { NW: 0, N: 0, NE: 0, W: 1, C: 1, E: 1, SW: 2, S: 2, SE: 2 };
const HPOS_OF: Record<ZoneKey, 0 | 1 | 2> = { NW: 0, W: 0, SW: 0, N: 1, C: 1, S: 1, NE: 2, E: 2, SE: 2 };

function fitWidths(ideals: number[], total: number, min: number): number[] {
  const sumI = ideals.reduce((a, b) => a + b, 0) || 1;
  const w = ideals.map((v) => (total * v) / sumI);
  const deficit = w.reduce((a, x) => a + Math.max(0, min - x), 0);
  if (deficit > 0) {
    const bigSum = w.filter((x) => x > min).reduce((a, x) => a + x, 0);
    return w.map((x) => (x < min ? min : bigSum > deficit ? x - (deficit * x) / bigSum : x));
  }
  return w;
}

export function buildBlueprint(inp: BlueprintInput): Blueprint {
  const builtW = Math.max(15, inp.builtW);
  const builtL = Math.max(15, inp.builtL);
  const plotW = Math.max(builtW, Number(inp.plotW) || builtW);
  const plotL = Math.max(builtL, Number(inp.plotL) || builtL);
  const freeW = plotW - builtW; const freeL = plotL - builtL;
  const margins = { w: Math.round(freeW * 0.35), e: Math.round(freeW * 0.65), n: Math.round(freeL * 0.65), s: Math.round(freeL * 0.35) };
  const offX = margins.w; const offY = margins.n;

  // ── assign rooms to zones ──
  const zoneRooms: Record<ZoneKey, { type: string; name?: Bi }[]> = { NW: [], N: [], NE: [], W: [], C: [], E: [], SW: [], S: [], SE: [] };
  const put = (z: ZoneKey, type: string, name?: Bi) => zoneRooms[z].push({ type, name });

  put('SW', 'master', N('Master Bedroom', 'मुख्य शयन कक्ष'));
  put('SE', 'kitchen');
  put('N', 'living');
  put('C', 'brahmasthan');
  if (inp.pooja) put('NE', 'pooja');

  const entranceZone: ZoneKey = inp.facing === 'N' ? 'N' : inp.facing === 'E' ? 'E' : inp.facing === 'S' ? 'S' : 'W';
  const bedZones: ZoneKey[] = ['NW', 'S', 'W', 'E'];
  let bedNo = 1;
  for (let i = 0; i < Math.max(0, Math.min(5, inp.bedrooms) - 1); i += 1) {
    const z = bedZones.find((zz) => zz !== entranceZone && zoneRooms[zz].length === 0) || bedZones[i % bedZones.length];
    bedNo += 1;
    put(z, z === 'NW' ? 'guestBedroom' : 'bedroom', z === 'NW' ? undefined : N(`Bedroom ${bedNo}`, `शयन कक्ष ${bedNo}`));
  }
  if (inp.dining) put('W', 'dining');
  if (inp.study) put(entranceZone === 'E' ? 'W' : 'E', 'study');
  const bathZones: ZoneKey[] = ['NW', 'S', 'W'];
  for (let i = 0; i < Math.max(0, Math.min(3, inp.bathrooms)); i += 1) put(bathZones[i % 3], 'bath');
  if (inp.store) put('S', 'store');
  if (inp.staircase) put('S', 'stairs');
  if (inp.parking && freeW + freeL <= 0) put('NW', 'parking');
  if (zoneRooms[entranceZone].length === 0) put(entranceZone, 'veranda');

  // ── flatten into 3 rows (N / C / S), ordered W→E within each row ──
  type RowItem = { type: string; name?: Bi; zone: ZoneKey; ideal: number };
  const rows: RowItem[][] = [[], [], []];
  (Object.keys(zoneRooms) as ZoneKey[]).forEach((z) => {
    zoneRooms[z].forEach((r) => rows[ROW_OF[z]].push({ ...r, zone: z, ideal: IDEAL_AREA[r.type] || 100 }));
  });
  rows.forEach((row) => row.sort((a, b) => HPOS_OF[a.zone] - HPOS_OF[b.zone] || a.zone.localeCompare(b.zone)));

  // ── row heights: weighted by content, soft-clamped so no band is too thin ──
  const rowIdeal = rows.map((row) => (row.length ? row.reduce((s, r) => s + r.ideal, 0) : 0.0001));
  const sumRow = rowIdeal.reduce((a, b) => a + b, 0);
  let rowH = rowIdeal.map((v) => (builtL * v) / sumRow);
  // clamp non-empty rows to [0.24, 0.42]·builtL, then renormalize
  const active = rows.map((r) => r.length > 0);
  rowH = rowH.map((h, i) => (active[i] ? Math.max(builtL * 0.24, Math.min(builtL * 0.42, h)) : 0));
  const hSum = rowH.reduce((a, b) => a + b, 0);
  rowH = rowH.map((h) => (h * builtL) / hSum);

  const rooms: BpRoom[] = [];
  let y = 0;
  rows.forEach((row, ri) => {
    if (!row.length) return;
    const h = rowH[ri];
    const widths = fitWidths(row.map((r) => r.ideal), builtW, Math.min(8, builtW / row.length));
    let x = 0;
    row.forEach((r, i) => {
      const w = i === row.length - 1 ? builtW - x : Math.round(widths[i] * 10) / 10;
      const meta = ROOM_META[r.type];
      const rw = Math.max(1, Math.round(w * 10) / 10);
      const rh = Math.round(h * 10) / 10;
      rooms.push({
        id: `${r.zone}-${r.type}-${i}`, type: r.type, name: r.name || meta.name, zone: r.zone,
        x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, w: rw, h: rh,
        cell: { x, y, w: rw, h: rh },
        color: meta.color, direction: DIR_LABEL[r.zone], areaSqft: Math.round(rw * rh),
        vastuScore: meta.score, reason: meta.reason, tip: meta.tip, editable: r.type !== 'brahmasthan',
      });
      x += w;
    });
    y += h;
  });

  // ── entrance on the facing edge, in the auspicious pada ──
  const seg = Math.min(3.5, Math.max(2.6, builtW * 0.09));
  let entrance: Blueprint['entrance'];
  if (inp.facing === 'N') entrance = { x1: builtW * 0.58, y1: 0, x2: builtW * 0.58 + seg, y2: 0, label: N('Main Door (North)', 'मुख्य द्वार (उत्तर)'), zoneNote: N('North entrance kept toward the North-East pada.', 'उत्तर प्रवेश — ईशान पद की ओर।') };
  else if (inp.facing === 'E') entrance = { x1: builtW, y1: builtL * 0.24, x2: builtW, y2: builtL * 0.24 + seg, label: N('Main Door (East)', 'मुख्य द्वार (पूर्व)'), zoneNote: N('East entrance — morning sunlight enters the home.', 'पूर्व प्रवेश — प्रातः सूर्य का प्रकाश घर में आता है।') };
  else if (inp.facing === 'S') entrance = { x1: builtW * 0.6, y1: builtL, x2: builtW * 0.6 + seg, y2: builtL, label: N('Main Door (South)', 'मुख्य द्वार (दक्षिण)'), zoneNote: N('South entrance kept toward the South-East pada (as tradition prefers).', 'दक्षिण प्रवेश — आग्नेय पद की ओर (परंपरा अनुसार)।') };
  else entrance = { x1: 0, y1: builtL * 0.26, x2: 0, y2: builtL * 0.26 + seg, label: N('Main Door (West)', 'मुख्य द्वार (पश्चिम)'), zoneNote: N('West entrance kept toward the North-West pada.', 'पश्चिम प्रवेश — वायव्य पद की ओर।') };

  const markers: BpMarker[] = [];
  if (inp.tankOverhead) markers.push({ id: 'tank-oh', kind: 'tank-overhead', x: builtW * 0.14, y: builtL * 0.9, label: N('Overhead tank (SW roof)', 'पानी की टंकी — छत, नैऋत्य') });
  if (inp.tankUnderground) markers.push({ id: 'tank-ug', kind: 'tank-underground', x: builtW * 0.88, y: builtL * 0.1, label: N('Underground water (NE)', 'भूमिगत जल — ईशान') });

  const notes: Bi[] = [
    N('North & East are kept lighter/open; heavy rooms sit toward the South-West.', 'उत्तर व पूर्व हल्के/खुले; भारी कमरे नैऋत्य की ओर।'),
    N('The centre (Brahmasthan) stays open and light.', 'केंद्र (ब्रह्मस्थान) खुला व हल्का रखा गया है।'),
    entrance.zoneNote,
  ];

  return { input: { ...inp, builtW, builtL }, plotW, plotL, builtW, builtL, offX, offY, margins, rooms, markers, entrance, notes };
}

/** Resize an edited room within its strip slot (anchored to its zone's outer corner). */
export function resizeRoom(bp: Blueprint, roomId: string, newW: number, newH: number): Blueprint {
  const rooms = bp.rooms.map((r) => {
    if (r.id !== roomId) return r;
    const w = Math.max(4, Math.min(r.cell.w, newW));
    const h = Math.max(4, Math.min(r.cell.h, newH));
    const col = HPOS_OF[r.zone]; const row = ROW_OF[r.zone];
    const x = col === 0 ? r.cell.x : col === 2 ? r.cell.x + r.cell.w - w : r.cell.x + (r.cell.w - w) / 2;
    const yy = row === 0 ? r.cell.y : row === 2 ? r.cell.y + r.cell.h - h : r.cell.y + (r.cell.h - h) / 2;
    return { ...r, x: Math.round(x * 10) / 10, y: Math.round(yy * 10) / 10, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10, areaSqft: Math.round(w * h) };
  });
  return { ...bp, rooms };
}
