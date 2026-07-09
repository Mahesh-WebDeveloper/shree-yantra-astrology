// Hanuman Chalisa — authentic, complete text by Goswami Tulsidas (public-domain Awadhi).
// Self-contained dataset (no scraping): each verse = one full doha/chaupai with Devanagari +
// Roman transliteration + faithful English translation. Per-verse easy meaning comes from AI
// (VerseMeaning → /api/ai/veda-explain, bilingual). Stored in VedaText (veda='hanuman-chalisa').
// Run: npm run import:hanuman-chalisa
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const VedaText = require('../models/VedaText');

// 2 opening dohas + 40 chaupais + 1 closing doha = 43 verses (numbered 1..43).
const DATA = [
  ['श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि।\nबरनउँ रघुबर बिमल जसु जो दायकु फल चारि॥', 'Shri Guru charan saroj raj, nij manu mukuru sudhaari.\nBaranau Raghubar bimal jasu, jo daayaku phal chaari.', 'Cleansing the mirror of my mind with the dust of my Guru’s lotus feet, I sing the pure glory of Shri Ram, which bestows the four fruits of life (dharma, wealth, desire and liberation).'],
  ['बुद्धिहीन तनु जानिके सुमिरौं पवन-कुमार।\nबल बुद्धि बिद्या देहु मोहिं हरहु कलेस बिकार॥', 'Buddhihiin tanu jaanike, sumirau Pavan-Kumaar.\nBal buddhi vidyaa dehu mohi, harahu kales bikaar.', 'Knowing myself to be lacking in wisdom, I remember you, O Son of the Wind. Grant me strength, intellect and knowledge, and remove my sorrows and faults.'],
  ['जय हनुमान ज्ञान गुन सागर।\nजय कपीस तिहुँ लोक उजागर॥', 'Jai Hanumaan gyaan gun saagar.\nJai Kapiis tihu lok ujaagar.', 'Victory to you, Hanuman, ocean of wisdom and virtue! Victory to the Lord of monkeys, who illumines all three worlds.'],
  ['राम दूत अतुलित बल धामा।\nअंजनि-पुत्र पवनसुत नामा॥', 'Raam duut atulit bal dhaamaa.\nAnjani-putra Pavansut naamaa.', 'You are Ram’s messenger, the abode of matchless strength; known as Anjani’s son and the Son of the Wind.'],
  ['महाबीर बिक्रम बजरंगी।\nकुमति निवार सुमति के संगी॥', 'Mahaabiir bikram Bajrangii.\nKumati nivaar sumati ke sangii.', 'O great hero, mighty as a thunderbolt (Bajrangi), remover of evil thoughts and companion of good sense.'],
  ['कंचन बरन बिराज सुबेसा।\nकानन कुंडल कुंचित केसा॥', 'Kanchan baran biraaj subesaa.\nKaanan kundal kunchit kesaa.', 'Golden-hued and beautifully attired, with rings in your ears and curly hair.'],
  ['हाथ बज्र औ ध्वजा बिराजै।\nकाँधे मूँज जनेऊ साजै॥', 'Haath bajra au dhvajaa biraajai.\nKaadhe muunj janeuu saajai.', 'In your hands shine a mace and a banner; a sacred thread of munja grass adorns your shoulder.'],
  ['संकर सुवन केसरीनंदन।\nतेज प्रताप महा जग बंदन॥', 'Sankar suvan Kesariinandan.\nTej prataap mahaa jag bandan.', 'O spiritual son of Shankar and delight of Kesari, your radiance and might are revered by the whole world.'],
  ['बिद्यावान गुनी अति चातुर।\nराम काज करिबे को आतुर॥', 'Vidyaavaan gunii ati chaatur.\nRaam kaaj karibe ko aatur.', 'Learned, virtuous and exceedingly clever, ever eager to do Ram’s work.'],
  ['प्रभु चरित्र सुनिबे को रसिया।\nराम लखन सीता मन बसिया॥', 'Prabhu charitra sunibe ko rasiyaa.\nRaam Lakhan Siitaa man basiyaa.', 'You delight in hearing the Lord’s deeds; Ram, Lakshman and Sita dwell in your heart.'],
  ['सूक्ष्म रूप धरि सियहिं दिखावा।\nबिकट रूप धरि लंक जरावा॥', 'Suukshma ruup dhari siyahi dikhaavaa.\nBikat ruup dhari Lank jaraavaa.', 'Assuming a tiny form you appeared before Sita; taking a fearsome form you burned Lanka.'],
  ['भीम रूप धरि असुर सँहारे।\nरामचंद्र के काज सँवारे॥', 'Bhiim ruup dhari asur saharey.\nRaamchandra ke kaaj savaarey.', 'Taking a mighty form you slew the demons and accomplished Lord Ramchandra’s tasks.'],
  ['लाय सजीवन लखन जियाये।\nश्रीरघुबीर हरषि उर लाये॥', 'Laay Sajiivan Lakhan jiyaaye.\nShri Raghubiir harashi ur laaye.', 'You brought the Sanjivani herb and revived Lakshman; Shri Ram joyfully embraced you.'],
  ['रघुपति कीन्ही बहुत बड़ाई।\nतुम मम प्रिय भरतहि सम भाई॥', 'Raghupati kiinhii bahut badaaii.\nTum mam priya Bharatahi sam bhaaii.', 'The Lord of the Raghus praised you greatly: “You are as dear to me as my brother Bharat.”'],
  ['सहस बदन तुम्हरो जस गावैं।\nअस कहि श्रीपति कंठ लगावैं॥', 'Sahas badan tumharo jas gaavai.\nAs kahi Shriipati kanth lagaavai.', '“A thousand mouths shall sing your glory” — saying so, the Lord embraced you.'],
  ['सनकादिक ब्रह्मादि मुनीसा।\nनारद सारद सहित अहीसा॥', 'Sanakaadik Brahmaadi muniisaa.\nNaarad Saarad sahit Ahiisaa.', 'Sanak and the sages, Brahma and the great seers, Narad, Saraswati and Sheshnag —'],
  ['जम कुबेर दिगपाल जहाँ ते।\nकबि कोबिद कहि सके कहाँ ते॥', 'Jam Kuber Digpaal jahaa te.\nKabi kobid kahi sake kahaa te.', 'Yama, Kuber and the guardians of the directions — even poets and scholars cannot fully describe your glory.'],
  ['तुम उपकार सुग्रीवहिं कीन्हा।\nराम मिलाय राज पद दीन्हा॥', 'Tum upakaar Sugriivahi kiinhaa.\nRaam milaay raaj pad diinhaa.', 'You did Sugriva a great favour, uniting him with Ram and restoring his kingship.'],
  ['तुम्हरो मंत्र बिभीषन माना।\nलंकेस्वर भए सब जग जाना॥', 'Tumharo mantra Bibhiishan maanaa.\nLankeshvar bhaye sab jag jaanaa.', 'Vibhishan heeded your counsel and became lord of Lanka, as the whole world knows.'],
  ['जुग सहस्र जोजन पर भानू।\nलील्यो ताहि मधुर फल जानू॥', 'Jug sahasra jojan par Bhaanu.\nLiilyo taahi madhur phal jaanu.', 'The sun, thousands of yojans away, you swallowed thinking it a sweet fruit.'],
  ['प्रभु मुद्रिका मेलि मुख माहीं।\nजलधि लाँघि गये अचरज नाहीं॥', 'Prabhu mudrikaa meli mukh maahii.\nJaladhi laaghi gaye achraj naahii.', 'Carrying the Lord’s ring in your mouth, you leapt across the ocean — no wonder in that.'],
  ['दुर्गम काज जगत के जेते।\nसुगम अनुग्रह तुम्हरे तेते॥', 'Durgam kaaj jagat ke jete.\nSugam anugrah tumhare tete.', 'However difficult a task in this world, it becomes easy by your grace.'],
  ['राम दुआरे तुम रखवारे।\nहोत न आज्ञा बिनु पैसारे॥', 'Raam duaare tum rakhvaare.\nHot na aagyaa binu paisaare.', 'You are the guardian at Ram’s door; none may enter without your leave.'],
  ['सब सुख लहै तुम्हारी सरना।\nतुम रच्छक काहू को डर ना॥', 'Sab sukh lahai tumhaarii saranaa.\nTum rachchhak kaahuu ko dar naa.', 'In your shelter all joys are found; with you as protector, there is nothing to fear.'],
  ['आपन तेज सम्हारो आपै।\nतीनों लोक हाँक तें काँपै॥', 'Aapan tej samhaaro aapai.\nTiino lok haak te kaapai.', 'You alone can hold your own power; at your roar the three worlds tremble.'],
  ['भूत पिसाच निकट नहिं आवै।\nमहाबीर जब नाम सुनावै॥', 'Bhuut pisaach nikat nahi aavai.\nMahaabiir jab naam sunaavai.', 'Ghosts and evil spirits dare not come near when your name, O Mighty Hero, is uttered.'],
  ['नासै रोग हरै सब पीरा।\nजपत निरंतर हनुमत बीरा॥', 'Naasai rog harai sab piiraa.\nJapat nirantar Hanumat biiraa.', 'Diseases vanish and all pain is removed for those who constantly repeat “Brave Hanuman.”'],
  ['संकट तें हनुमान छुड़ावै।\nमन क्रम बचन ध्यान जो लावै॥', 'Sankat te Hanumaan chhudaavai.\nMan kram bachan dhyaan jo laavai.', 'Hanuman frees from troubles those who remember him in thought, deed and word.'],
  ['सब पर राम तपस्वी राजा।\nतिन के काज सकल तुम साजा॥', 'Sab par Raam tapasvii raajaa.\nTin ke kaaj sakal tum saajaa.', 'Ram, the ascetic king, reigns over all; you accomplish all his tasks.'],
  ['और मनोरथ जो कोई लावै।\nसोइ अमित जीवन फल पावै॥', 'Aur manorath jo koii laavai.\nSoi amit jiivan phal paavai.', 'Whoever brings any heartfelt wish to you obtains its abundant fruit in life.'],
  ['चारों जुग परताप तुम्हारा।\nहै परसिद्ध जगत उजियारा॥', 'Chaaro jug partaap tumhaaraa.\nHai parsiddh jagat ujiyaaraa.', 'Your glory shines through all four ages; it is renowned and illumines the world.'],
  ['साधु संत के तुम रखवारे।\nअसुर निकंदन राम दुलारे॥', 'Saadhu sant ke tum rakhvaare.\nAsur nikandan Raam dulaare.', 'You protect the saints and the good, destroy demons, and are dear to Ram.'],
  ['अष्ट सिद्धि नौ निधि के दाता।\nअस बर दीन जानकी माता॥', 'Asht siddhi nau nidhi ke daataa.\nAs bar diin Jaanakii maataa.', 'You bestow the eight powers and nine treasures — such a boon Mother Janaki (Sita) gave you.'],
  ['राम रसायन तुम्हरे पासा।\nसदा रहो रघुपति के दासा॥', 'Raam rasaayan tumhare paasaa.\nSadaa raho Raghupati ke daasaa.', 'The elixir of devotion to Ram is with you; may you ever remain the servant of the Lord of the Raghus.'],
  ['तुम्हरे भजन राम को पावै।\nजनम जनम के दुख बिसरावै॥', 'Tumhare bhajan Raam ko paavai.\nJanam janam ke dukh bisraavai.', 'Through singing your praise one attains Ram and forgets the sorrows of countless births.'],
  ['अंत काल रघुबर पुर जाई।\nजहाँ जन्म हरिभक्त कहाई॥', 'Ant kaal Raghubar pur jaaii.\nJahaa janm Haribhakt kahaaii.', 'At life’s end one goes to Ram’s abode, and is thereafter born as a devotee of Hari.'],
  ['और देवता चित्त न धरई।\nहनुमत सेइ सर्ब सुख करई॥', 'Aur devtaa chitt na dharaii.\nHanumat sei sarb sukh karaii.', 'One need hold no other deity in mind; serving Hanuman alone brings every happiness.'],
  ['संकट कटै मिटै सब पीरा।\nजो सुमिरै हनुमत बलबीरा॥', 'Sankat katai mitai sab piiraa.\nJo sumirai Hanumat balbiiraa.', 'All troubles are cut away and every pain removed for whoever remembers the mighty, brave Hanuman.'],
  ['जय जय जय हनुमान गोसाईं।\nकृपा करहु गुरुदेव की नाईं॥', 'Jai Jai Jai Hanumaan Gosaaii.\nKripaa karahu Gurudev kii naaii.', 'Victory, victory, victory to Lord Hanuman! Bestow your grace upon me as my divine Guru.'],
  ['जो सत बार पाठ कर कोई।\nछूटहि बंदि महा सुख होई॥', 'Jo sat baar paath kar koii.\nChhuutahi bandi mahaa sukh hoii.', 'Whoever recites this a hundred times is freed from bondage and gains great bliss.'],
  ['जो यह पढ़ै हनुमान चालीसा।\nहोय सिद्धि साखी गौरीसा॥', 'Jo yah padhai Hanumaan Chaaliisaa.\nHoy siddhi saakhii Gauriisaa.', 'Whoever reads this Hanuman Chalisa attains perfection — Lord Shiva (Gaurisha) is witness.'],
  ['तुलसीदास सदा हरि चेरा।\nकीजै नाथ हृदय महँ डेरा॥', 'Tulsiidaas sadaa Hari cheraa.\nKiijai naath hriday mah deraa.', 'Tulsidas is ever Hari’s servant; O Lord, make your dwelling in my heart.'],
  ['पवनतनय संकट हरन, मंगल मूरति रूप।\nराम लखन सीता सहित, हृदय बसहु सुर भूप॥', 'Pavantanay sankat haran, mangal muurati ruup.\nRaam Lakhan Siitaa sahit, hriday basahu sur bhuup.', 'O Son of the Wind, remover of afflictions, embodiment of auspiciousness — dwell in my heart with Ram, Lakshman and Sita, O King of the gods.'],
];

async function run() {
  const verses = DATA.map((v, i) => ({ verse: i + 1, sanskrit: v[0], transliteration: v[1], english: v[2], hindi: '' }));
  if (verses.length !== 43) throw new Error(`Expected 43 verses, got ${verses.length}`);

  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected — importing Hanuman Chalisa…');
  await VedaText.deleteMany({ veda: 'hanuman-chalisa' });
  await VedaText.create({
    veda: 'hanuman-chalisa', book: 1, bookName: 'Hanuman Chalisa',
    section: 1, sectionName: 'Hanuman Chalisa', verseCount: verses.length, hindiReady: true, verses,
  });
  console.log(`Done. Hanuman Chalisa imported — ${verses.length} verses (2 doha + 40 chaupai + 1 doha).`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error('Import failed:', e); process.exit(1); });
