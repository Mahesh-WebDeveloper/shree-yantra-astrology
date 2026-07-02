'use strict';

const crypto = require('crypto');
const { SOURCES, DIRECTIONS, ROOM_TYPES, LEARN_TOPICS } = require('../data/vastuRules');
const { callAI } = require('./ai.service');

const DIRECTION_ALIASES = {
  n: 'N', north: 'N', uttar: 'N', 'उत्तर': 'N',
  ne: 'NE', northeast: 'NE', 'north-east': 'NE', ishan: 'NE', ishanya: 'NE', 'ईशान': 'NE', 'ईशान कोण': 'NE',
  e: 'E', east: 'E', purv: 'E', poorv: 'E', 'पूर्व': 'E',
  se: 'SE', southeast: 'SE', 'south-east': 'SE', agni: 'SE', 'अग्नि': 'SE', 'अग्नि कोण': 'SE',
  s: 'S', south: 'S', dakshin: 'S', 'दक्षिण': 'S',
  sw: 'SW', southwest: 'SW', 'south-west': 'SW', nairutya: 'SW', nairitya: 'SW', 'नैऋत्य': 'SW', 'नैऋत्य कोण': 'SW',
  w: 'W', west: 'W', paschim: 'W', 'पश्चिम': 'W',
  nw: 'NW', northwest: 'NW', 'north-west': 'NW', vayavya: 'NW', 'वायव्य': 'NW', 'वायव्य कोण': 'NW',
  center: 'CENTER', centre: 'CENTER', brahmasthan: 'CENTER', 'ब्रह्मस्थान': 'CENTER',
};

const ROOM_ALIASES = {
  entrance: 'mainEntrance',
  mainDoor: 'mainEntrance',
  door: 'mainEntrance',
  kitchen: 'kitchen',
  master: 'masterBedroom',
  masterBedroom: 'masterBedroom',
  bedroom: 'bedroom',
  puja: 'pujaRoom',
  pooja: 'pujaRoom',
  mandir: 'pujaRoom',
  toilet: 'toilet',
  bathroom: 'toilet',
  washroom: 'toilet',
  living: 'livingRoom',
  livingRoom: 'livingRoom',
  hall: 'livingRoom',
  study: 'studyRoom',
  studyRoom: 'studyRoom',
  stairs: 'staircase',
  staircase: 'staircase',
  tank: 'overheadWaterTank',
  overheadTank: 'overheadWaterTank',
  waterTank: 'overheadWaterTank',
  undergroundWater: 'undergroundWater',
  borewell: 'undergroundWater',
  locker: 'cashLocker',
  cash: 'cashLocker',
};

const PLAN_CELLS = {
  NW: { x: 0, y: 0, w: 33.33, h: 33.33 },
  N: { x: 33.33, y: 0, w: 33.34, h: 33.33 },
  NE: { x: 66.67, y: 0, w: 33.33, h: 33.33 },
  W: { x: 0, y: 33.33, w: 33.33, h: 33.34 },
  CENTER: { x: 33.33, y: 33.33, w: 33.34, h: 33.34 },
  E: { x: 66.67, y: 33.33, w: 33.33, h: 33.34 },
  SW: { x: 0, y: 66.67, w: 33.33, h: 33.33 },
  S: { x: 33.33, y: 66.67, w: 33.34, h: 33.33 },
  SE: { x: 66.67, y: 66.67, w: 33.33, h: 33.33 },
};

const PLAN_ROOM_COLORS = {
  mainEntrance: '#f0c65e',
  kitchen: '#e46f3c',
  masterBedroom: '#7c5bd6',
  bedroom: '#4f7dd9',
  pujaRoom: '#f4d785',
  toilet: '#4aa5a5',
  livingRoom: '#65b96f',
  studyRoom: '#6d9df2',
  staircase: '#8f7254',
  overheadWaterTank: '#4d7fd9',
  undergroundWater: '#3c95c9',
  cashLocker: '#b58a30',
  center: '#d9c28a',
};

function normalizeDirection(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const key = raw.toUpperCase().replace(/\s+/g, '').replace(/_/g, '-');
  if (DIRECTIONS[key]) return key;
  const simple = raw.toLowerCase().trim().replace(/\s+/g, '-').replace(/[_.]/g, '-');
  return DIRECTION_ALIASES[simple] || null;
}

function normalizeRoomType(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (ROOM_TYPES[raw]) return raw;
  const key = raw.replace(/[^A-Za-z]/g, '');
  return ROOM_ALIASES[key] || ROOM_ALIASES[key.charAt(0).toLowerCase() + key.slice(1)] || null;
}

function localize(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return lang === 'hi' ? (obj.hi || obj.en || '') : (obj.en || obj.hi || '');
}

function bi(en, hi) { return { en, hi }; }

function dirName(key) {
  const d = DIRECTIONS[key] || {};
  return { key, en: d.en || key, hi: d.hi || key, element: d.element || null };
}

function roomLabel(type) {
  const spec = ROOM_TYPES[type];
  return spec ? spec.label : { en: type, hi: type };
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeInput(input = {}) {
  const propertyType = String(input.propertyType || 'home').toLowerCase();
  const facing = normalizeDirection(input.facing || input.mainFacing || input.direction) || 'E';
  const width = toNumber(input.plot && input.plot.width != null ? input.plot.width : input.width, 30);
  const length = toNumber(input.plot && input.plot.length != null ? input.plot.length : input.length, 45);
  const unit = String((input.plot && input.plot.unit) || input.unit || 'ft').trim() || 'ft';
  const requirements = {
    bedrooms: Math.max(1, Math.min(5, Number(input.requirements && input.requirements.bedrooms) || Number(input.bedrooms) || 2)),
    floors: Math.max(1, Math.min(4, Number(input.requirements && input.requirements.floors) || Number(input.floors) || 1)),
    includePujaRoom: input.requirements && input.requirements.includePujaRoom === false ? false : true,
    includeStudy: !!(input.requirements && input.requirements.includeStudy),
  };
  return { propertyType, facing, plot: { width, length, unit, area: Math.round(width * length) }, requirements };
}

function normalizeRooms(rawRooms) {
  const rooms = {};
  if (!rawRooms || typeof rawRooms !== 'object') return rooms;

  if (Array.isArray(rawRooms)) {
    rawRooms.forEach((item) => {
      const type = normalizeRoomType(item && (item.type || item.roomType || item.name));
      const direction = normalizeDirection(item && (item.direction || item.dir || item.zone));
      if (type && direction) rooms[type] = { direction, size: item.size || null, note: item.note || '' };
    });
    return rooms;
  }

  Object.entries(rawRooms).forEach(([key, value]) => {
    const type = normalizeRoomType(key);
    if (!type) return;
    const direction = normalizeDirection(value && typeof value === 'object' ? (value.direction || value.dir || value.zone) : value);
    if (direction) rooms[type] = {
      direction,
      size: value && typeof value === 'object' ? (value.size || null) : null,
      note: value && typeof value === 'object' ? (value.note || '') : '',
    };
  });
  return rooms;
}

function classifyRoom(type, direction) {
  const spec = ROOM_TYPES[type];
  if (!spec || !direction) return { status: 'unknown', ratio: 0.5, severity: 'medium' };
  if (spec.ideal.includes(direction)) return { status: 'good', ratio: 1, severity: 'positive' };
  if (spec.ok.includes(direction)) return { status: 'ok', ratio: 0.72, severity: 'low' };
  if (spec.avoid.includes(direction)) return { status: 'problem', ratio: 0.22, severity: spec.weight >= 10 ? 'high' : 'medium' };
  return { status: 'neutral', ratio: 0.5, severity: 'medium' };
}

function issueText(type, direction, status) {
  const spec = ROOM_TYPES[type];
  const room = spec.label;
  const dir = dirName(direction);
  if (status === 'good') {
    return {
      title: bi(`${room.en} is well placed`, `${room.hi} सही स्थान पर है`),
      finding: bi(`${room.en} in ${dir.en} matches the preferred Vastu zone.`, `${room.hi} ${dir.hi} में है, जो पसंदीदा वास्तु क्षेत्र से मेल खाता है।`),
      recommendation: bi('Keep this zone clean, bright and uncluttered.', 'इस क्षेत्र को साफ, रोशन और व्यवस्थित रखें।'),
    };
  }
  if (status === 'ok') {
    return {
      title: bi(`${room.en} is acceptable`, `${room.hi} स्वीकार्य स्थान पर है`),
      finding: bi(`${room.en} in ${dir.en} is workable, though not the first preference.`, `${room.hi} ${dir.hi} में कामचलाऊ है, हालांकि यह पहला श्रेष्ठ विकल्प नहीं है।`),
      recommendation: spec.remedy,
    };
  }
  if (status === 'problem') {
    const ideal = spec.ideal.map((d) => DIRECTIONS[d].en).join(', ');
    const idealHi = spec.ideal.map((d) => DIRECTIONS[d].hi).join(', ');
    return {
      title: bi(`${room.en} needs correction`, `${room.hi} में सुधार चाहिए`),
      finding: bi(`${room.en} in ${dir.en} is traditionally avoided. Preferred zone: ${ideal}.`, `${room.hi} ${dir.hi} में परंपरा अनुसार टालना बेहतर माना जाता है। श्रेष्ठ क्षेत्र: ${idealHi}।`),
      recommendation: spec.remedy,
    };
  }
  return {
    title: bi(`${room.en} needs review`, `${room.hi} की समीक्षा करें`),
    finding: bi(`${room.en} in ${dir.en} is a mixed placement.`, `${room.hi} ${dir.hi} में मिश्रित स्थिति है।`),
    recommendation: spec.remedy,
  };
}

function evaluateRooms(rooms) {
  const findings = [];
  let total = 0;
  let earned = 0;
  const sourceSet = new Set(['modern-safety']);

  Object.entries(rooms).forEach(([type, info]) => {
    const spec = ROOM_TYPES[type];
    if (!spec) return;
    const direction = info.direction;
    const cls = classifyRoom(type, direction);
    const text = issueText(type, direction, cls.status);
    const score = Math.round(spec.weight * cls.ratio * 10) / 10;
    total += spec.weight;
    earned += score;
    spec.sourceIds.forEach((id) => sourceSet.add(id));
    findings.push({
      id: `${type}-${direction}`,
      roomType: type,
      room: spec.label,
      direction: dirName(direction),
      status: cls.status,
      severity: cls.severity,
      weight: spec.weight,
      score,
      title: text.title,
      finding: text.finding,
      why: spec.why,
      recommendation: text.recommendation,
      remedy: spec.remedy,
      sourceIds: spec.sourceIds,
      confidence: spec.confidence,
    });
  });

  const score = total > 0 ? Math.max(1, Math.min(100, Math.round((earned / total) * 100))) : null;
  return { findings, score, totalWeight: total, sourceIds: Array.from(sourceSet) };
}

function scoreBand(score) {
  if (score == null) return {
    key: 'plan',
    title: bi('Vastu plan ready', 'वास्तु नक्शा तैयार'),
    text: bi('Add your current room directions to audit the existing layout.', 'मौजूदा घर की जांच के लिए कमरों की दिशाएं जोड़ें।'),
  };
  if (score >= 85) return {
    key: 'excellent',
    title: bi('Excellent Vastu balance', 'बहुत अच्छा वास्तु संतुलन'),
    text: bi('Most key rooms are already in strong or acceptable zones.', 'अधिकांश मुख्य कमरे मजबूत या स्वीकार्य क्षेत्रों में हैं।'),
  };
  if (score >= 70) return {
    key: 'good',
    title: bi('Good, with a few corrections', 'अच्छा, कुछ सुधार के साथ'),
    text: bi('The layout is workable. Focus on the highlighted corrections first.', 'लेआउट उपयोगी है। पहले चिन्हित सुधारों पर ध्यान दें।'),
  };
  if (score >= 55) return {
    key: 'needs-work',
    title: bi('Needs practical corrections', 'व्यावहारिक सुधार की जरूरत'),
    text: bi('Some important placements need balancing through layout or non-demolition remedies.', 'कुछ महत्वपूर्ण स्थानों को लेआउट या बिना तोड़-फोड़ के उपायों से संतुलित करना होगा।'),
  };
  return {
    key: 'critical',
    title: bi('High-priority Vastu review', 'उच्च प्राथमिकता वाली वास्तु समीक्षा'),
    text: bi('Several key rooms are in avoided zones. Use the priority list before finalizing construction or renovation.', 'कई मुख्य कमरे टाले जाने वाले क्षेत्रों में हैं। निर्माण या सुधार से पहले प्राथमिकता सूची देखें।'),
  };
}

function roomPlan(type, direction, custom = {}) {
  const cell = PLAN_CELLS[direction];
  const spec = type === 'center' ? { label: { en: 'Open center', hi: 'खुला केंद्र' } } : ROOM_TYPES[type];
  return {
    id: custom.id || `${type}-${direction}`,
    type,
    direction: dirName(direction),
    label: custom.label || (spec ? spec.label : { en: type, hi: type }),
    x: cell.x,
    y: cell.y,
    w: cell.w,
    h: cell.h,
    color: PLAN_ROOM_COLORS[type] || '#d0a84d',
    note: custom.note || '',
  };
}

function entranceMarker(direction) {
  const d = normalizeDirection(direction) || 'E';
  const common = { direction: dirName(d), label: bi('Main door', 'मुख्य द्वार') };
  if (d === 'N' || d === 'NE' || d === 'NW') return { ...common, x1: 44, y1: 0, x2: 56, y2: 0 };
  if (d === 'S' || d === 'SE' || d === 'SW') return { ...common, x1: 44, y1: 100, x2: 56, y2: 100 };
  if (d === 'W') return { ...common, x1: 0, y1: 44, x2: 0, y2: 56 };
  return { ...common, x1: 100, y1: 44, x2: 100, y2: 56 };
}

function generateSuggestedPlan(input, rooms = {}) {
  const { facing, plot, requirements, propertyType } = input;
  const entranceDir = ['N', 'NE', 'E', 'NW'].includes(facing) ? facing : (facing === 'W' ? 'NW' : 'E');
  const planRooms = [
    roomPlan('toilet', 'NW'),
    roomPlan('studyRoom', 'N', { label: requirements.includeStudy ? ROOM_TYPES.studyRoom.label : bi('Study / kids', 'अध्ययन / बच्चे') }),
    roomPlan(requirements.includePujaRoom ? 'pujaRoom' : 'livingRoom', 'NE'),
    roomPlan('bedroom', 'W'),
    roomPlan('center', 'CENTER'),
    roomPlan('livingRoom', 'E'),
    roomPlan('masterBedroom', 'SW'),
    roomPlan('staircase', 'S'),
    roomPlan('kitchen', 'SE'),
  ];

  const notes = [
    {
      title: bi('North is shown at top', 'ऊपर उत्तर दिखाया गया है'),
      text: bi('The diagram is a Vastu zoning map, not an engineering drawing. Exact wall thickness, beams, columns and bylaws need an architect/engineer.', 'यह वास्तु जोनिंग नक्शा है, इंजीनियरिंग ड्राइंग नहीं। दीवार, बीम, कॉलम और नियमों के लिए आर्किटेक्ट/इंजीनियर जरूरी है।'),
    },
    {
      title: bi('Brahmasthan kept open', 'ब्रह्मस्थान खुला रखा गया'),
      text: bi('The center is intentionally kept lighter for circulation and openness.', 'आवागमन और खुलेपन के लिए केंद्र को हल्का रखा गया है।'),
    },
  ];

  return {
    id: crypto.createHash('sha1').update(JSON.stringify({ facing, plot, requirements, propertyType })).digest('hex').slice(0, 12),
    title: bi('Suggested Vastu zoning map', 'सुझाया गया वास्तु जोनिंग नक्शा'),
    subtitle: bi(`${plot.width} x ${plot.length} ${plot.unit} ${propertyType}`, `${plot.width} x ${plot.length} ${plot.unit} ${propertyType}`),
    viewBox: '0 0 100 100',
    northAtTop: true,
    plot,
    facing: dirName(facing),
    entrance: entranceMarker(entranceDir),
    rooms: planRooms,
    notes,
    correctionsForExisting: Object.values(rooms).length ? comparePlanToExisting(rooms) : [],
  };
}

function comparePlanToExisting(rooms) {
  return Object.entries(rooms).map(([type, info]) => {
    const spec = ROOM_TYPES[type];
    if (!spec) return null;
    const cls = classifyRoom(type, info.direction);
    if (cls.status === 'good' || cls.status === 'ok') return null;
    return {
      roomType: type,
      room: spec.label,
      current: dirName(info.direction),
      suggested: spec.ideal.map(dirName),
      text: bi(
        `Move ${spec.label.en.toLowerCase()} toward ${spec.ideal.map((d) => DIRECTIONS[d].en).join(', ')} if construction is still flexible.`,
        `अगर निर्माण अभी बदल सकता है, तो ${spec.label.hi} को ${spec.ideal.map((d) => DIRECTIONS[d].hi).join(', ')} की ओर रखें।`
      ),
      nonDemolition: spec.remedy,
    };
  }).filter(Boolean);
}

function buildAnalysis(input = {}) {
  const normalized = normalizeInput(input);
  const rooms = normalizeRooms(input.rooms || input.currentLayout);
  const audit = evaluateRooms(rooms);
  const band = scoreBand(audit.score);
  const priority = audit.findings
    .filter((x) => x.status === 'problem' || x.status === 'neutral')
    .sort((a, b) => (b.weight - a.weight))
    .slice(0, 6);
  const positives = audit.findings.filter((x) => x.status === 'good').slice(0, 5);
  const sourcesUsed = audit.sourceIds.map((id) => Object.values(SOURCES).find((s) => s.id === id) || SOURCES[id]).filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    version: 'vastu-rule-db-v1',
    input: normalized,
    roomInputs: rooms,
    summary: {
      score: audit.score,
      band: band.key,
      title: band.title,
      text: band.text,
      auditedRooms: Object.keys(rooms).length,
      note: bi(
        'Scores are deterministic from the app rule database. Vastu outcomes are traditional guidance, not a scientific guarantee.',
        'स्कोर ऐप के नियम-डेटाबेस से निश्चित रूप से निकाला गया है। वास्तु परिणाम पारंपरिक मार्गदर्शन हैं, वैज्ञानिक गारंटी नहीं।'
      ),
    },
    findings: audit.findings.sort((a, b) => ROOM_TYPES[a.roomType].order - ROOM_TYPES[b.roomType].order),
    priority,
    positives,
    suggestedPlan: generateSuggestedPlan(normalized, rooms),
    learn: LEARN_TOPICS,
    directions: Object.values(DIRECTIONS),
    sourcesUsed,
    safety: {
      title: bi('Safety first', 'सुरक्षा पहले'),
      text: bi(
        'Do not change beams, columns, electrical lines, plumbing, fire exits or load-bearing walls only for Vastu without a qualified professional.',
        'केवल वास्तु के लिए बीम, कॉलम, बिजली लाइन, प्लंबिंग, फायर एग्जिट या लोड-बेयरिंग दीवार में बदलाव योग्य विशेषज्ञ के बिना न करें।'
      ),
      sourceId: 'modern-safety',
    },
  };
}

function deterministicAnswer({ analysis, question, lang }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const top = analysis.priority[0];
  if (!top) {
    return {
      answer: L === 'hi'
        ? 'आपके दिए हुए विवरण में कोई बड़ा वास्तु दोष नहीं दिख रहा है। मुख्य ध्यान सफाई, प्रकाश, हवा और ब्रह्मस्थान को हल्का रखने पर दें।'
        : 'No major Vastu concern appears in the details provided. Focus on cleanliness, light, ventilation and keeping the center lighter.',
      sections: [],
      remedies: [],
      followUpQuestions: L === 'hi'
        ? ['क्या मैं रसोई और मुख्य द्वार की दिशा भी जांचूं?', 'क्या आप नए घर का नक्शा बनवाना चाहते हैं?']
        : ['Should I also check the kitchen and main entrance?', 'Do you want a new home zoning map?'],
      confidence: 0.72,
      sourceNote: 'Rule-engine fallback',
    };
  }
  return {
    answer: localize(top.finding, L) + ' ' + localize(top.recommendation, L),
    sections: [{ title: localize(top.title, L), text: localize(top.why, L) }],
    remedies: [localize(top.remedy, L)],
    followUpQuestions: L === 'hi'
      ? ['इस कमरे को बिना तोड़-फोड़ कैसे ठीक करें?', 'मेरे लिए सही नक्शा कैसे बनेगा?']
      : ['How can I fix this without demolition?', 'How should my ideal layout be planned?'],
    confidence: 0.74,
    sourceNote: 'Rule-engine fallback',
  };
}

async function askVastu(input = {}) {
  const question = String(input.question || '').trim();
  if (!question) {
    const e = new Error('question required');
    e.status = 400;
    throw e;
  }
  const lang = input.lang === 'hi' ? 'hi' : 'en';
  // Recompute on the server for trust. The client may send a previous analysis for
  // UI convenience, but AI grounding must always use server-side rule-engine facts.
  const analysis = buildAnalysis(input);
  const sourceSummary = (analysis.sourcesUsed || []).map((s) => `${s.title}: ${s.note}`).join('\n');
  const prompt = `You are a Vastu Shastra guide inside the Shree Yantra app.
Use ONLY the VASTU ANALYSIS JSON and SOURCE SUMMARY below. Do not invent any new rule, direction, score, source, dimension or guarantee.
If the user asks for structural, beam, column, plumbing, electrical, fire-safety or legal changes, tell them to verify with a qualified architect/engineer.
Be practical, calm and non-fearful. Suggest low-cost non-demolition remedies first.

USER QUESTION:
${question}

VASTU ANALYSIS JSON:
${JSON.stringify(analysis, null, 2)}

SOURCE SUMMARY:
${sourceSummary}

Return STRICT JSON only:
{
  "answer": "clear answer in the requested language",
  "sections": [{"title":"short title","text":"2-4 simple sentences"}],
  "remedies": ["2-5 practical remedies if relevant"],
  "followUpQuestions": ["2-4 useful next questions"],
  "confidence": 0.0,
  "sourceNote": "short note explaining that answer is grounded in the rule engine"
}
Write in ${lang === 'hi' ? 'Hindi' : 'English'} only.`;

  try {
    const out = await callAI(prompt, { json: true });
    return {
      analysis,
      answer: typeof out.answer === 'string' ? out.answer : '',
      sections: Array.isArray(out.sections) ? out.sections.slice(0, 6) : [],
      remedies: Array.isArray(out.remedies) ? out.remedies.map(String).filter(Boolean).slice(0, 6) : [],
      followUpQuestions: Array.isArray(out.followUpQuestions) ? out.followUpQuestions.map(String).filter(Boolean).slice(0, 5) : [],
      confidence: Math.max(0.1, Math.min(0.95, Number(out.confidence) || 0.7)),
      sourceNote: typeof out.sourceNote === 'string' ? out.sourceNote : 'Grounded in Vastu rule engine.',
      aiAssisted: true,
    };
  } catch (_) {
    return { analysis, ...deterministicAnswer({ analysis, question, lang }), aiAssisted: false };
  }
}

module.exports = {
  buildAnalysis,
  askVastu,
  normalizeDirection,
  normalizeRooms,
};
