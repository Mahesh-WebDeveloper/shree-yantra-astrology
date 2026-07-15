// Generic Purana chapter stories ("कथा") — plain-language retellings, per chapter.
//
// Same design as generateShivaStories.js (which stays for history): each chapter's story
// is written from THAT chapter's OWN shlokas already in the DB — never from a third-party
// retelling, whose prose is copyrighted however freely it is published.
//
// Idempotent + resumable: chapters that already have a story are skipped unless --force.
// Usage: node src/scripts/generatePuranaStories.js --veda puran-vishnu [--force] [--book N] [--limit N]
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const VedaText = require('../models/VedaText');
const { callAI } = require('../services/ai.service');

const NAMES = {
  'puran-vishnu': 'विष्णु महापुराण',   'puran-shiva': 'शिव महापुराण',
  'puran-bhagavata': 'श्रीमद्भागवत महापुराण', 'puran-brahma': 'ब्रह्म पुराण',
  'puran-padma': 'पद्म पुराण',         'puran-narada': 'नारद पुराण',
  'puran-markandeya': 'मार्कण्डेय पुराण', 'puran-agni': 'अग्नि पुराण',
  'puran-bhavishya': 'भविष्य पुराण',    'puran-brahmavaivarta': 'ब्रह्मवैवर्त पुराण',
  'puran-linga': 'लिंग पुराण',          'puran-varaha': 'वराह पुराण',
  'puran-skanda': 'स्कन्द पुराण',       'puran-vamana': 'वामन पुराण',
  'puran-kurma': 'कूर्म पुराण',         'puran-matsya': 'मत्स्य पुराण',
  'puran-garuda': 'गरुड़ पुराण',        'puran-brahmanda': 'ब्रह्माण्ड पुराण',
};

const CONCURRENCY = 3;
const MAX_SHLOKAS_IN_PROMPT = 60;

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const VEDA = val('--veda');
if (!VEDA || !NAMES[VEDA]) { console.error('Usage: --veda <puran-id> (known: ' + Object.keys(NAMES).join(', ') + ')'); process.exit(1); }
const GRANTH = NAMES[VEDA];

function prompt(doc) {
  const vs = doc.verses;
  const step = Math.max(1, Math.ceil(vs.length / MAX_SHLOKAS_IN_PROMPT));
  const sample = vs.filter((_, i) => i % step === 0).map((v) => `${v.verse}. ${v.sanskrit}`).join('\n');

  return `तुम्हें ${GRANTH} के एक अध्याय की मूल संस्कृत श्लोक दिए जा रहे हैं। इन्हीं श्लोकों के आधार पर इस अध्याय की कथा सरल हिंदी में लिखो।

ग्रंथ: ${GRANTH}
खंड: ${doc.bookName}
अध्याय: ${doc.section}
कुल श्लोक: ${doc.verses.length}

मूल श्लोक:
${sample}

निर्देश:
1. कथा पूरी तरह इन्हीं श्लोकों पर आधारित हो। जो इनमें नहीं है, वह मत लिखो — कोई नई घटना, नाम या विवरण मत जोड़ो।
2. भाषा बहुत सरल हो — ऐसी कि जिस पाठक को हिंदू धर्म या पुराणों का कोई ज्ञान न हो, यहाँ तक कि एक बच्चा भी, वह आसानी से समझ ले। कठिन संस्कृत शब्दों से बचो; ज़रूरी हो तो कोष्ठक में सरल अर्थ दो — जैसे "तप (कठिन साधना)"।
3. कहानी की तरह लिखो — बहती हुई प्रवाहमय गद्य में। बुलेट पॉइंट नहीं।
4. लंबाई: 200–350 शब्द। अनुच्छेदों में बाँटो।
5. यह किसी का सारांश नहीं, बल्कि इन्हीं श्लोकों का सीधा-सरल पुनर्कथन है — श्लोकों का क्रम बनाए रखो।
6. अंक अंग्रेज़ी में लिखो (1, 2, 3)।

इसके साथ अध्याय का एक छोटा शीर्षक भी दो, जो बताए कि इस अध्याय में क्या होता है।

अंग्रेज़ी अनुवाद भी दो — उतनी ही सरल अंग्रेज़ी में (same story, English).

सिर्फ़ JSON लौटाओ, कुछ और नहीं:
{"titleHi":"…","titleEn":"…","storyHi":"…","storyEn":"…"}`;
}

async function storyFor(doc) {
  const out = await callAI(prompt(doc), { json: true });
  const j = typeof out === 'string' ? JSON.parse(out) : out;
  if (!j || !j.storyHi || !j.titleHi) throw new Error('bad AI shape');
  return {
    storyTitle: { hi: String(j.titleHi).trim(), en: String(j.titleEn || '').trim() },
    story: { hi: String(j.storyHi).trim(), en: String(j.storyEn || '').trim() },
    storyReady: true,
  };
}

async function run() {
  await mongoose.connect(env.mongoUri);

  const q = { veda: VEDA };
  if (!has('--force')) q.storyReady = { $ne: true };
  if (has('--book')) q.book = Number(val('--book'));

  let docs = await VedaText.find(q).sort({ book: 1, section: 1 });
  if (has('--limit')) docs = docs.slice(0, Number(val('--limit')));

  const total = await VedaText.countDocuments({ veda: VEDA });
  const done0 = await VedaText.countDocuments({ veda: VEDA, storyReady: true });
  console.log(`${GRANTH} stories — ${done0}/${total} already written · generating ${docs.length}`);

  let ok = 0, fail = 0;
  const queue = [...docs];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const doc = queue.shift();
      const tag = `${doc.bookName} · अध्याय ${doc.section}`;
      try {
        Object.assign(doc, await storyFor(doc));
        await doc.save();
        ok++;
        if (ok % 10 === 0 || ok === 1) console.log(`  [${ok}/${docs.length}] ${tag} → "${doc.storyTitle.hi}"`);
      } catch (e) { fail++; console.log(`  !! ${tag}: ${e.message}`); }
    }
  }));

  const done = await VedaText.countDocuments({ veda: VEDA, storyReady: true });
  console.log(`\nDone. ${ok} written, ${fail} failed. Coverage: ${done}/${total} chapters.`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Failed:', e); process.exit(1); });
