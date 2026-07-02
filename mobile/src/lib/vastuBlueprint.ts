/**
 * vastuBlueprint.ts — deterministic Vastu house-plan layout engine (NO AI, pure rules).
 *
 * Classical zone placement (Mayamata / Manasara / Brihat Samhita tradition, same sources
 * as backend vastuRules.js):
 *   SW  → master bedroom (heaviest, owner)         SE → kitchen (Agni)
 *   NE  → pooja + water (lightest, most open)      N  → living / treasury
 *   NW  → guest bedroom / bath / parking (Vayu)    W  → dining / kids / study
 *   S   → store / stairs / extra bedroom           E  → entrance side / veranda / study
 *   CENTER → Brahmasthan (open courtyard, keep light)
 *   Plot bigger than built area → building sits toward South-West so North & East
 *   stay MORE open (traditional rule).
 *
 * All maths in FEET. The result is a concept plan a builder can take to an architect —
 * we always attach a disclaimer that municipal/structural approval needs a professional.
 */

export type Bi = { en: string; hi: string };
export type Facing = 'N' | 'E' | 'S' | 'W';
export type ZoneKey = 'NW' | 'N' | 'NE' | 'W' | 'C' | 'E' | 'SW' | 'S' | 'SE';

export interface BlueprintInput {
  plotW?: number | null;   // plot width ft (E-W), optional
  plotL?: number | null;   // plot length ft (N-S), optional
  builtW: number;          // built area width ft
  builtL: number;          // built area length ft
  facing: Facing;
  bedrooms: number;        // 1..5
  bathrooms: number;       // 1..3
  pooja: boolean;
  dining: boolean;
  study: boolean;
  store: boolean;
  staircase: boolean;
  parking: boolean;
  tankOverhead: boolean;
  tankUnderground: boolean;
}

export interface BpRoom {
  id: string;
  type: string;
  name: Bi;
  zone: ZoneKey;
  // ft, relative to BUILT area top-left; top edge = North
  x: number; y: number; w: number; h: number;
  // zone cell bounds (for edit clamping + re-anchoring)
  cell: { x: number; y: number; w: number; h: number };
  color: string;
  reason: Bi;
  editable: boolean;
}

export interface BpMarker { id: string; kind: 'tank-overhead' | 'tank-underground'; x: number; y: number; label: Bi }

export interface Blueprint {
  input: BlueprintInput;
  plotW: number; plotL: number;          // effective plot (>= built)
  builtW: number; builtL: number;
  offX: number; offY: number;            // built origin inside plot (ft)
  margins: { n: number; s: number; e: number; w: number };
  rooms: BpRoom[];
  markers: BpMarker[];
  entrance: { x1: number; y1: number; x2: number; y2: number; label: Bi; zoneNote: Bi };
  notes: Bi[];
}

const N = (en: string, hi: string): Bi => ({ en, hi });

const ROOM_META: Record<string, { name: Bi; color: string; reason: Bi }> = {
  master: { name: N('Master Bedroom', 'मुख्य शयन कक्ष'), color: '#8fb0dd', reason: N('South-West is the heaviest, most stable corner — ideal for the head of the family.', 'नैऋत्य (द-प) सबसे भारी व स्थिर कोना है — घर के मुखिया के लिए सर्वोत्तम।') },
  bedroom: { name: N('Bedroom', 'शयन कक्ष'), color: '#9fc2e8', reason: N('South and West sides suit bedrooms — restful, away from the active North-East.', 'दक्षिण/पश्चिम की ओर शयन कक्ष शुभ — विश्राम के लिए शांत क्षेत्र।') },
  guestBedroom: { name: N('Guest Bedroom', 'अतिथि कक्ष'), color: '#b2cdec', reason: N('North-West (Vayu) suits guests — comfortable but naturally transient.', 'वायव्य (उ-प) अतिथियों हेतु उत्तम — सुखद पर अस्थायी भाव का क्षेत्र।') },
  kitchen: { name: N('Kitchen', 'रसोई'), color: '#e2a75c', reason: N('South-East is the Agni (fire) corner — the classical place for cooking.', 'आग्नेय (द-पू) अग्नि कोण है — रसोई का शास्त्रीय स्थान।') },
  pooja: { name: N('Pooja Room', 'पूजा घर'), color: '#ead886', reason: N('North-East (Ishan) is the most sacred, lightest corner — best for worship.', 'ईशान (उ-पू) सबसे पवित्र व हल्का कोना — पूजा हेतु सर्वश्रेष्ठ।') },
  bath: { name: N('Bathroom / Toilet', 'स्नान / शौचालय'), color: '#93bfc7', reason: N('North-West or South placement keeps drains away from the sacred North-East.', 'वायव्य/दक्षिण में शौचालय — पवित्र ईशान से दूर रहता है।') },
  living: { name: N('Living Room', 'बैठक'), color: '#a3cf9d', reason: N('North is open and welcoming — ideal for family and guests to gather.', 'उत्तर खुला व स्वागतमय क्षेत्र — बैठक हेतु आदर्श।') },
  dining: { name: N('Dining Room', 'भोजन कक्ष'), color: '#d3a8cd', reason: N('West dining near the kitchen supports calm, satisfying meals.', 'पश्चिम में भोजन कक्ष — रसोई के पास, शांति से भोजन हेतु शुभ।') },
  study: { name: N('Study Room', 'अध्ययन कक्ष'), color: '#c9bd8e', reason: N('East/West study benefits from morning light and steady focus.', 'पूर्व/पश्चिम में अध्ययन — प्रातः प्रकाश व एकाग्रता हेतु उत्तम।') },
  store: { name: N('Store Room', 'भंडार कक्ष'), color: '#b8b49b', reason: N('South/South-West storage adds weight where Vastu wants it heavy.', 'दक्षिण/नैऋत्य में भंडार — जहाँ भार शुभ है वहीं वज़न बढ़ाता है।') },
  stairs: { name: N('Staircase', 'सीढ़ियाँ'), color: '#c7a98a', reason: N('South/South-West stairs keep the heavy structure in the heavy zone.', 'दक्षिण/नैऋत्य में सीढ़ियाँ — भारी संरचना भारी क्षेत्र में।') },
  parking: { name: N('Parking', 'पार्किंग'), color: '#a9b7c6', reason: N('North-West suits vehicles — the zone of movement (Vayu).', 'वायव्य वाहन हेतु उत्तम — गति (वायु) का क्षेत्र।') },
  veranda: { name: N('Veranda / Lobby', 'बरामदा'), color: '#d9c9a3', reason: N('An open, bright entrance zone welcomes energy into the home.', 'खुला व उज्ज्वल प्रवेश क्षेत्र — घर में सकारात्मक ऊर्जा लाता है।') },
  brahmasthan: { name: N('Courtyard (Brahmasthan)', 'आँगन (ब्रह्मस्थान)'), color: '#efe6c8', reason: N('The centre is kept open and light — the heart of the home breathes here.', 'केंद्र खुला व हल्का रहे — यही घर का हृदय है।') },
};

// zone grid indices: col 0=W-side … 2=E-side; row 0=N … 2=S
const ZONE_POS: Record<ZoneKey, { col: number; row: number }> = {
  NW: { col: 0, row: 0 }, N: { col: 1, row: 0 }, NE: { col: 2, row: 0 },
  W: { col: 0, row: 1 }, C: { col: 1, row: 1 }, E: { col: 2, row: 1 },
  SW: { col: 0, row: 2 }, S: { col: 1, row: 2 }, SE: { col: 2, row: 2 },
};

export function buildBlueprint(inp: BlueprintInput): Blueprint {
  const builtW = Math.max(15, inp.builtW);
  const builtL = Math.max(15, inp.builtL);
  const plotW = Math.max(builtW, Number(inp.plotW) || builtW);
  const plotL = Math.max(builtL, Number(inp.plotL) || builtL);

  // built block sits toward SW so N & E stay more open (classical rule)
  const freeW = plotW - builtW;
  const freeL = plotL - builtL;
  const margins = { w: Math.round(freeW * 0.35), e: Math.round(freeW * 0.65), n: Math.round(freeL * 0.65), s: Math.round(freeL * 0.35) };
  const offX = margins.w;
  const offY = margins.n;

  // 3×3 zone cells inside the built area
  const cw = [builtW * 0.34, builtW * 0.32, builtW * 0.34];
  const rh = [builtL * 0.34, builtL * 0.32, builtL * 0.34];
  const cx = [0, cw[0], cw[0] + cw[1]];
  const cy = [0, rh[0], rh[0] + rh[1]];
  const cellOf = (z: ZoneKey) => {
    const p = ZONE_POS[z];
    return { x: cx[p.col], y: cy[p.row], w: cw[p.col], h: rh[p.row] };
  };

  // ── assign rooms to zones (priority per classical rules) ──
  const zoneRooms: Record<ZoneKey, { type: string; meta: typeof ROOM_META[string]; name?: Bi }[]> = {
    NW: [], N: [], NE: [], W: [], C: [], E: [], SW: [], S: [], SE: [],
  };
  const put = (z: ZoneKey, type: string, name?: Bi) => zoneRooms[z].push({ type, meta: ROOM_META[type], name });

  put('SW', 'master', N('Master Bedroom', 'मुख्य शयन कक्ष'));
  put('SE', 'kitchen');
  put('N', 'living');
  put('C', 'brahmasthan');
  if (inp.pooja) put('NE', 'pooja');

  // extra bedrooms: NW → S → W → E (skip entrance zone when possible)
  const bedZones: ZoneKey[] = ['NW', 'S', 'W', 'E'];
  const entranceZone: ZoneKey = inp.facing === 'N' ? 'N' : inp.facing === 'E' ? 'E' : inp.facing === 'S' ? 'S' : 'W';
  let bedNo = 1;
  for (let i = 0; i < Math.max(0, Math.min(5, inp.bedrooms) - 1); i += 1) {
    const z = bedZones.find((zz) => zz !== entranceZone && zoneRooms[zz].length === 0) || bedZones[i % bedZones.length];
    bedNo += 1;
    put(z, z === 'NW' ? 'guestBedroom' : 'bedroom', z === 'NW' ? undefined : N(`Bedroom ${bedNo}`, `शयन कक्ष ${bedNo}`));
  }
  if (inp.dining) put('W', 'dining');
  if (inp.study) put(entranceZone === 'E' ? 'W' : 'E', 'study');
  // bathrooms: NW, S, W (small, share cells)
  const bathZones: ZoneKey[] = ['NW', 'S', 'W'];
  for (let i = 0; i < Math.max(0, Math.min(3, inp.bathrooms)); i += 1) put(bathZones[i % 3], 'bath');
  if (inp.store) put('S', 'store');
  if (inp.staircase) put('S', 'stairs');
  if (inp.parking && freeW + freeL <= 0) put('NW', 'parking'); // inside only if no open plot

  // entrance veranda in the facing zone (if that cell is otherwise empty)
  if (zoneRooms[entranceZone].length === 0) put(entranceZone, 'veranda');

  // ── materialize rooms: split each zone cell among its rooms ──
  const rooms: BpRoom[] = [];
  (Object.keys(zoneRooms) as ZoneKey[]).forEach((z) => {
    const list = zoneRooms[z];
    if (!list.length) return;
    const cell = cellOf(z);
    const horizontal = cell.w >= cell.h; // split along the longer side
    list.forEach((r, i) => {
      const isBath = r.type === 'bath' || r.type === 'stairs' || r.type === 'store';
      // small utility rooms take a smaller share
      const shares = list.map((x) => (x.type === 'bath' || x.type === 'stairs' || x.type === 'store' ? 0.7 : 1));
      const totalShare = shares.reduce((a, b) => a + b, 0);
      const myShare = shares[i] / totalShare;
      const before = shares.slice(0, i).reduce((a, b) => a + b, 0) / totalShare;
      let x = cell.x; let y = cell.y; let w = cell.w; let h = cell.h;
      if (list.length > 1) {
        if (horizontal) { x = cell.x + cell.w * before; w = cell.w * myShare; }
        else { y = cell.y + cell.h * before; h = cell.h * myShare; }
      }
      rooms.push({
        id: `${z}-${r.type}-${i}`,
        type: r.type,
        name: r.name || r.meta.name,
        zone: z,
        x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10,
        w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10,
        cell: { x, y, w, h },
        color: r.meta.color,
        reason: r.meta.reason,
        editable: r.type !== 'brahmasthan',
      });
      void isBath;
    });
  });

  // ── entrance segment on the facing edge, in the auspicious portion ──
  const eCell = cellOf(entranceZone);
  let entrance: Blueprint['entrance'];
  const segW = Math.min(8, Math.max(4, builtW * 0.12));
  if (inp.facing === 'N') entrance = { x1: eCell.x + eCell.w * 0.45, y1: 0, x2: eCell.x + eCell.w * 0.45 + segW, y2: 0, label: N('Main Door (North)', 'मुख्य द्वार (उत्तर)'), zoneNote: N('North entrance — kept toward the North-East portion.', 'उत्तर प्रवेश — ईशान की ओर रखा गया है।') };
  else if (inp.facing === 'E') entrance = { x1: builtW, y1: eCell.y + eCell.h * 0.2, x2: builtW, y2: eCell.y + eCell.h * 0.2 + segW, label: N('Main Door (East)', 'मुख्य द्वार (पूर्व)'), zoneNote: N('East entrance — morning sunlight enters the home.', 'पूर्व प्रवेश — प्रातः सूर्य का प्रकाश घर में आता है।') };
  else if (inp.facing === 'S') entrance = { x1: eCell.x + eCell.w * 0.55, y1: builtL, x2: eCell.x + eCell.w * 0.55 + segW, y2: builtL, label: N('Main Door (South)', 'मुख्य द्वार (दक्षिण)'), zoneNote: N('South entrance — kept toward the South-East portion as tradition prefers.', 'दक्षिण प्रवेश — परंपरा अनुसार आग्नेय की ओर रखा गया है।') };
  else entrance = { x1: 0, y1: eCell.y + eCell.h * 0.2, x2: 0, y2: eCell.y + eCell.h * 0.2 + segW, label: N('Main Door (West)', 'मुख्य द्वार (पश्चिम)'), zoneNote: N('West entrance — kept toward the North-West portion.', 'पश्चिम प्रवेश — वायव्य की ओर रखा गया है।') };

  // ── water tank markers ──
  const markers: BpMarker[] = [];
  if (inp.tankOverhead) markers.push({ id: 'tank-oh', kind: 'tank-overhead', x: cw[0] * 0.5, y: cy[2] + rh[2] * 0.85, label: N('Overhead tank (SW roof)', 'पानी की टंकी — छत, नैऋत्य') });
  if (inp.tankUnderground) markers.push({ id: 'tank-ug', kind: 'tank-underground', x: cx[2] + cw[2] * 0.8, y: rh[0] * 0.2, label: N('Underground water (NE)', 'भूमिगत जल — ईशान') });

  const notes: Bi[] = [
    N('North & East are kept more open; the building sits toward the South-West.', 'उत्तर व पूर्व अधिक खुले रखे गए हैं; भवन नैऋत्य की ओर है।'),
    N('The centre (Brahmasthan) stays open and light.', 'केंद्र (ब्रह्मस्थान) खुला व हल्का रखा गया है।'),
    entrance.zoneNote,
  ];

  return { input: { ...inp, builtW, builtL }, plotW, plotL, builtW, builtL, offX, offY, margins, rooms, markers, entrance, notes };
}

/** Re-fit an edited room inside its zone cell, anchored toward its outer corner. */
export function resizeRoom(bp: Blueprint, roomId: string, newW: number, newH: number): Blueprint {
  const rooms = bp.rooms.map((r) => {
    if (r.id !== roomId) return r;
    const w = Math.max(4, Math.min(r.cell.w, newW));
    const h = Math.max(4, Math.min(r.cell.h, newH));
    const p = ZONE_POS[r.zone];
    const x = p.col === 0 ? r.cell.x : p.col === 2 ? r.cell.x + r.cell.w - w : r.cell.x + (r.cell.w - w) / 2;
    const y = p.row === 0 ? r.cell.y : p.row === 2 ? r.cell.y + r.cell.h - h : r.cell.y + (r.cell.h - h) / 2;
    return { ...r, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 };
  });
  return { ...bp, rooms };
}
