require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { collectServerMetrics } = require('../src/services/serverMetrics.service');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const a = await collectServerMetrics();
  await new Promise((r) => setTimeout(r, 2000));
  const b = await collectServerMetrics();
  console.log(JSON.stringify({
    hostname: a.host.hostname,
    cpu1: a.cpu.usagePct,
    cpu2: b.cpu.usagePct,
    mem1: a.memory.usedPct,
    mem2: b.memory.usedPct,
    disk: a.disk,
    users: a.users,
    historyLen: b.history.length,
    at: a.at,
  }, null, 2));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
