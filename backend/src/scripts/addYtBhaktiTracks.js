// Hanuman Chalisa + Sankat Mochan Ashtak (bhajan) aur Mahamrityunjay 108 (mantra) —
// user ke diye YouTube videos se; idempotent (audioUrl par skip-if-exists).
const ITEMS = [
  { slug: 'bhajan/hanuman-chalisa',    title: 'Shree Hanuman Chalisa',          hi: 'श्री हनुमान चालीसा',            cat: 'bhajan', sub: 'hanuman', artist: 'Hariharan', secs: 581,  src: 'https://www.youtube.com/watch?v=AETFvQonfV8' },
  { slug: 'bhajan/hanuman-ashtak',     title: 'Sankat Mochan Hanuman Ashtak',   hi: 'संकट मोचन हनुमानाष्टक',        cat: 'bhajan', sub: 'hanuman', artist: 'Hariharan', secs: 374,  src: 'https://www.youtube.com/watch?v=HH_a6aRO1TE' },
  { slug: 'mantra/mahamrityunjay-108', title: 'Mahamrityunjay Mantra 108 Times', hi: 'महामृत्युंजय मंत्र · 108 बार', cat: 'mantra', sub: 'shiv',    artist: 'Shankar Sahney', secs: 2630, src: 'https://www.youtube.com/watch?v=adyjwFgXRNY' },
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
  console.log('bhajan:', await col.countDocuments({ category: 'bhajan' }), '| mantra:', await col.countDocuments({ category: 'mantra' }));
  process.exit(0);
});
