const ITEMS = [
  ['jai-ganesh-deva',       'Jai Ganesh Jai Ganesh Deva',    'जय गणेश जय गणेश देवा',        'ganesh',   262],
  ['om-jai-shiv-omkara',    'Om Jai Shiv Omkara',            'ॐ जय शिव ओंकारा',             'shiv',     298],
  ['om-jai-jagdish-hare',   'Om Jai Jagdish Hare',           'ॐ जय जगदीश हरे',              'vishnu',   331],
  ['jai-ambe-gauri',        'Jai Ambe Gauri',                'जय अम्बे गौरी',                'durga',    450],
  ['aarti-keejei-hanuman',  'Aarti Keejei Hanuman Lala Ki',  'आरती कीजै हनुमान लला की',      'hanuman',  283],
  ['jai-lakshmi-ramna',     'Jai Lakshmi Ramna',             'जय लक्ष्मी रमणा',              'lakshmi',  363],
  ['om-jai-lakshmi-mata',   'Om Jai Lakshmi Mata',           'ॐ जय लक्ष्मी माता',            'lakshmi',  333],
  ['aarti-shree-ramayan-ji','Aarti Shree Ramayan Ji Ki',     'आरती श्री रामायण जी की',       'ram',      374],
  ['jai-santoshi-mata',     'Jai Santoshi Mata',             'जय संतोषी माता',               'santoshi', 478],
  ['jai-jai-parvati-mata',  'Jai Jai Parvati Mata',          'जय जय पार्वती माता',           'parvati',  456],
];
const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/shree_yantra').then(async () => {
  const col = mongoose.connection.db.collection('mediaitems');
  let added = 0;
  for (const [slug, title, hiName, deity, secs] of ITEMS) {
    const audioUrl = `/uploads/audio/aarti/${slug}.mp3`;
    const exists = await col.findOne({ audioUrl });
    if (exists) { console.log('skip (already):', title); continue; }
    await col.insertOne({
      audioUrl, title, subtitle: hiName, artist: 'Traditional',
      category: 'aarti', subCategory: deity, tags: ['aarti', deity],
      language: 'hi', sourceType: 'audio', durationText: fmt(secs),
      isPremium: false, published: true, order: 0,
      attribution: '', licenseName: '', licenseUrl: '',
      sourceName: 'YouTube', sourceUrl: 'https://www.youtube.com/watch?v=sd31yGqZFlA',
      rightsNote: 'Testing only — production se pehle rights-cleared recording lagao',
      thumbnailImage: '', translations: { en: {}, hi: {} },
      createdAt: new Date(), updatedAt: new Date(), __v: 0,
    });
    added++; console.log('added:', title, fmt(secs));
  }
  console.log('total aarti ab:', await col.countDocuments({ category: 'aarti' }));
  process.exit(0);
});
