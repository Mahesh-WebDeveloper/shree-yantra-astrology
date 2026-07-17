// Category safai — "Aarti Keejai…" bhajan me padi thi (wo aarti hai), aur do purane
// items ka subCategory generic 'free_devotional' tha. Idempotent.
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/shree_yantra').then(async () => {
  const col = mongoose.connection.db.collection('mediaitems');
  const ops = [
    [{ title: 'Aarti Keejai Hanuman Lala Ki', category: 'bhajan' }, { category: 'aarti', subCategory: 'hanuman', tags: ['aarti', 'hanuman'] }],
    [{ title: 'Ram Naam Bhajan', subCategory: 'free_devotional' }, { subCategory: 'ram', tags: ['bhajan', 'ram'] }],
    [{ title: 'Om Namah Shivaya', subCategory: 'free_devotional' }, { subCategory: 'shiv', tags: ['mantra', 'shiv'] }],
  ];
  for (const [q, set] of ops) {
    const r = await col.updateOne(q, { $set: { ...set, updatedAt: new Date() } });
    console.log(q.title, '→', r.modifiedCount ? 'fixed' : 'already ok');
  }
  console.log('aarti:', await col.countDocuments({ category: 'aarti' }), '| bhajan:', await col.countDocuments({ category: 'bhajan' }));
  process.exit(0);
});
