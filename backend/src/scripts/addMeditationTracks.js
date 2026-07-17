// Nayi 'meditation' category — sirf instrumental tunes (flute/sitar/tabla); user ke
// YouTube links se. Idempotent (audioUrl par skip-if-exists).
const ITEMS = [
  { slug: 'meditation/varanasi-temple-flow', title: 'Varanasi Temple Flow', hi: 'सितार · बांसुरी · तबला', cat: 'meditation', sub: 'sitar', artist: 'Instrumental', secs: 5876, src: 'https://www.youtube.com/watch?v=tAk4G8Rs1RQ' },
  { slug: 'meditation/dopamine-boost-flow',  title: 'Positive Energy Flow',  hi: 'बांसुरी · सितार · तबला', cat: 'meditation', sub: 'flute', artist: 'Instrumental', secs: 1667, src: 'https://www.youtube.com/watch?v=kY7GcKagdjI' },
  { slug: 'meditation/spiritual-temple-music', title: 'Spiritual Temple Music', hi: 'बांसुरी · तबला · सितार', cat: 'meditation', sub: 'flute', artist: 'Instrumental', secs: 2053, src: 'https://www.youtube.com/watch?v=NF4gjQzGetw' },
  { slug: 'mantra/karpur-gauram', title: 'Karpur Gauram Karunavtaram', hi: 'कर्पूर गौरं करुणावतारं · शिव आरती मंत्र', cat: 'mantra', sub: 'shiv', artist: 'Wave LoFi Bhajans', secs: 263, src: 'https://www.youtube.com/watch?v=LxVUj791ycA' },
  { slug: 'bhajan/hum-katha-sunate', title: 'Hum Katha Sunate', hi: 'हम कथा सुनाते राम सकल गुण धाम की · उत्तर रामायण (लव-कुश)', cat: 'bhajan', sub: 'ram', artist: 'Traditional', secs: 939, src: 'https://www.youtube.com/watch?v=c-72uuITVMc' },
  { slug: 'mantra/hare-krishna-hare-rama', title: 'Hare Krishna Hare Rama', hi: 'हरे कृष्ण महामंत्र · ISKCON कीर्तन · गहन ध्यान', cat: 'mantra', sub: 'krishna', artist: 'ISKCON Kirtan', secs: 2257, src: 'https://www.youtube.com/watch?v=t-lg_Fe8NDc' },
  { slug: 'bhajan/krishna-govind-hare-murari', title: 'Shri Krishna Govind Hare Murari', hi: 'श्री कृष्ण गोविंद हरे मुरारी', cat: 'bhajan', sub: 'krishna', artist: 'Jagjit Singh', secs: 1226, src: 'https://www.youtube.com/watch?v=S6UiK9YD0mE' },
];
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/shree_yantra').then(async () => {
  const col = mongoose.connection.db.collection('mediaitems');
  for (const it of ITEMS) {
    const audioUrl = `/uploads/audio/${it.slug}.mp3`;
    if (await col.findOne({ audioUrl })) { console.log('skip (already):', it.title); continue; }
    await col.insertOne({
      audioUrl, title: it.title, subtitle: it.hi, artist: it.artist,
      category: it.cat, subCategory: it.sub, tags: [it.cat, it.sub],
      language: 'hi', sourceType: 'audio', durationText: fmt(it.secs),
      isPremium: false, published: true, order: 0,
      attribution: '', licenseName: '', licenseUrl: '',
      sourceName: 'YouTube', sourceUrl: it.src,
      rightsNote: 'Testing only — production se pehle rights-cleared recording lagao',
      thumbnailImage: '', translations: { en: {}, hi: {} },
      createdAt: new Date(), updatedAt: new Date(), __v: 0,
    });
    console.log('added:', it.title, fmt(it.secs));
  }
  console.log('meditation:', await col.countDocuments({ category: 'meditation' }), '| bhajan:', await col.countDocuments({ category: 'bhajan' }));
  process.exit(0);
});
