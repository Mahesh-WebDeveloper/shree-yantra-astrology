const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const User = require('../models/User');

const execFileAsync = promisify(execFile);

const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const HISTORY_MAX = 90;
const history = [];

let prevCpu = null;

function readLinuxCpu() {
  const line = fs.readFileSync('/proc/stat', 'utf8').split('\n')[0];
  const parts = line.trim().split(/\s+/).slice(1).map(Number);
  const idle = parts[3] + (parts[4] || 0);
  const total = parts.reduce((a, b) => a + b, 0);
  return { idle, total };
}

async function sampleCpuPercent() {
  try {
    if (process.platform !== 'linux') {
      const cores = os.cpus().length || 1;
      const load = os.loadavg()[0] || 0;
      return Math.max(0, Math.min(100, Math.round((load / cores) * 100)));
    }
    const cur = readLinuxCpu();
    if (!prevCpu) {
      prevCpu = cur;
      await new Promise((r) => setTimeout(r, 180));
      return sampleCpuPercent();
    }
    const idleDelta = cur.idle - prevCpu.idle;
    const totalDelta = cur.total - prevCpu.total;
    prevCpu = cur;
    if (totalDelta <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((1 - idleDelta / totalDelta) * 100)));
  } catch {
    const cores = os.cpus().length || 1;
    return Math.max(0, Math.min(100, Math.round(((os.loadavg()[0] || 0) / cores) * 100)));
  }
}

async function sampleDisk() {
  try {
    if (process.platform === 'win32') {
      return null;
    }
    const { stdout } = await execFileAsync('df', ['-kP', '/'], { timeout: 5000 });
    const line = stdout.trim().split('\n')[1];
    if (!line) return null;
    const parts = line.split(/\s+/);
    const totalBytes = parseInt(parts[1], 10) * 1024;
    const usedBytes = parseInt(parts[2], 10) * 1024;
    const freeBytes = parseInt(parts[3], 10) * 1024;
    if (!totalBytes) return null;
    return {
      mount: parts[5] || '/',
      totalBytes,
      usedBytes,
      freeBytes,
      usedPct: Math.round((usedBytes / totalBytes) * 100),
    };
  } catch {
    return null;
  }
}

async function sampleSwap() {
  try {
    if (process.platform !== 'linux') return null;
    const info = fs.readFileSync('/proc/meminfo', 'utf8');
    const read = (key) => {
      const m = info.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'));
      return m ? parseInt(m[1], 10) * 1024 : 0;
    };
    const total = read('SwapTotal');
    const free = read('SwapFree');
    if (!total) return { totalBytes: 0, usedBytes: 0, freeBytes: 0, usedPct: 0 };
    const used = total - free;
    return {
      totalBytes: total,
      usedBytes: used,
      freeBytes: free,
      usedPct: Math.round((used / total) * 100),
    };
  } catch {
    return null;
  }
}

async function samplePm2() {
  try {
    const { stdout } = await execFileAsync('pm2', ['jlist'], { timeout: 5000 });
    const list = JSON.parse(stdout);
    const app = Array.isArray(list)
      ? list.find((p) => p.name === 'shree-backend') || list[0]
      : null;
    if (!app || !app.monit) return null;
    return {
      name: app.name,
      status: app.pm2_env?.status || 'unknown',
      restarts: app.pm2_env?.restart_time ?? app.pm2_env?.restartTime ?? 0,
      cpuPct: app.monit.cpu ?? 0,
      memoryBytes: app.monit.memory ?? 0,
      memoryHuman: fmtBytes(app.monit.memory ?? 0),
      pid: app.pid,
    };
  } catch {
    return null;
  }
}

async function sampleMongoStats() {
  try {
    if (mongoose.connection.readyState !== 1) return null;
    const db = mongoose.connection.db;
    const stats = await db.stats();
    return {
      collections: stats.collections ?? 0,
      objects: stats.objects ?? 0,
      dataSizeHuman: fmtBytes(stats.dataSize ?? 0),
      storageSizeHuman: fmtBytes(stats.storageSize ?? 0),
      indexSizeHuman: fmtBytes(stats.indexSize ?? 0),
    };
  } catch {
    return null;
  }
}

function fmtBytes(n) {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function fmtUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function estimateCapacity(cpuPct, memPct, onlineUsers, totalMemBytes) {
  const cpuHeadroom = Math.max(0, 100 - cpuPct);
  const memHeadroom = Math.max(0, 100 - memPct);
  const headroom = Math.min(cpuHeadroom, memHeadroom);
  const memGb = totalMemBytes / (1024 ** 3);
  const baseCapacity = Math.round(Math.max(200, memGb * 180 + os.cpus().length * 120));

  const estimatedMax = Math.max(50, Math.round(baseCapacity * (headroom / 100) * 0.85));
  const comfortable = Math.max(30, Math.round(estimatedMax * 0.65));
  const usageVsComfort = comfortable > 0 ? Math.round((onlineUsers / comfortable) * 100) : 0;

  let status = 'healthy';
  let statusLabel = 'Running smoothly';
  let statusLabelHi = 'सर्वर सहज चल रहा है';
  let statusHint = 'Plenty of room for more users right now.';
  let statusHintHi = 'अभी और users के लिए पर्याप्त जगह है।';

  if (cpuPct >= 85 || memPct >= 90 || usageVsComfort >= 100) {
    status = 'critical';
    statusLabel = 'Needs attention';
    statusLabelHi = 'ध्यान देने की जरूरत';
    statusHint = 'Server is under heavy load. Consider upgrading or reducing traffic.';
    statusHintHi = 'सर्वर पर भारी लोड है। अपग्रेड या ट्रैफ़िक कम करने पर विचार करें।';
  } else if (cpuPct >= 65 || memPct >= 78 || usageVsComfort >= 75) {
    status = 'busy';
    statusLabel = 'Getting busy';
    statusLabelHi = 'लोड बढ़ रहा है';
    statusHint = 'Still fine, but watch usage if more users join.';
    statusHintHi = 'अभी ठीक है, लेकिन users बढ़ें तो नज़र रखें।';
  }

  return {
    estimatedMaxConcurrent: estimatedMax,
    comfortableConcurrent: comfortable,
    currentActiveUsers: onlineUsers,
    headroomPct: headroom,
    usageVsComfortPct: usageVsComfort,
    status,
    statusLabel,
    statusLabelHi,
    statusHint,
    statusHintHi,
    plainSummary: `About ${comfortable.toLocaleString('en-IN')} users at once is comfortable. Right now ${onlineUsers.toLocaleString('en-IN')} are using the app.`,
    plainSummaryHi: `लगभग ${comfortable.toLocaleString('en-IN')} users एक साथ आराम से चल सकते हैं। अभी ${onlineUsers.toLocaleString('en-IN')} app use कर रहे हैं।`,
  };
}

async function userCounts() {
  const cut = new Date(Date.now() - ONLINE_WINDOW_MS);
  const day = new Date(Date.now() - 86400000);
  const week = new Date(Date.now() - 7 * 86400000);

  const [onlineUsers, onlineDevices, activeToday, activeWeek, totalUsers] = await Promise.all([
    AnalyticsEvent.distinct('user', { user: { $ne: null }, createdAt: { $gte: cut } }).then((a) => a.length),
    AnalyticsEvent.distinct('deviceId', { createdAt: { $gte: cut } }).then((a) => a.length),
    AnalyticsEvent.distinct('user', { user: { $ne: null }, createdAt: { $gte: day } }).then((a) => a.length),
    AnalyticsEvent.distinct('user', { user: { $ne: null }, createdAt: { $gte: week } }).then((a) => a.length),
    User.countDocuments({ role: 'user', blocked: false }),
  ]);

  return { onlineUsers, onlineDevices, activeToday, activeWeek, totalUsers };
}

function pushHistory(point) {
  history.push(point);
  while (history.length > HISTORY_MAX) history.shift();
}

async function collectServerMetrics() {
  const [cpuPct, disk, users, swap, pm2, mongoStats] = await Promise.all([
    sampleCpuPercent(),
    sampleDisk(),
    userCounts(),
    sampleSwap(),
    samplePm2(),
    sampleMongoStats(),
  ]);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPct = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;
  const proc = process.memoryUsage();

  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = dbStates[mongoose.connection.readyState] || 'unknown';

  const point = {
    t: new Date().toISOString(),
    cpuPct,
    memPct,
    onlineUsers: users.onlineUsers,
    load1: Number((os.loadavg()[0] || 0).toFixed(2)),
  };
  pushHistory(point);

  const capacity = estimateCapacity(cpuPct, memPct, users.onlineUsers, totalMem);

  return {
    at: new Date().toISOString(),
    host: {
      hostname: os.hostname(),
      platform: process.platform,
      arch: os.arch(),
      cpus: os.cpus().length,
      uptimeSec: Math.floor(os.uptime()),
      uptimeHuman: fmtUptime(os.uptime()),
      nodeVersion: process.version,
    },
    cpu: {
      usagePct: cpuPct,
      load1: Number((os.loadavg()[0] || 0).toFixed(2)),
      load5: Number((os.loadavg()[1] || 0).toFixed(2)),
      cores: os.cpus().length,
    },
    memory: {
      totalBytes: totalMem,
      usedBytes: usedMem,
      freeBytes: freeMem,
      usedPct: memPct,
      totalHuman: fmtBytes(totalMem),
      usedHuman: fmtBytes(usedMem),
      freeHuman: fmtBytes(freeMem),
    },
    process: {
      rssBytes: proc.rss,
      heapUsedBytes: proc.heapUsed,
      heapTotalBytes: proc.heapTotal,
      rssHuman: fmtBytes(proc.rss),
      uptimeSec: Math.floor(process.uptime()),
      uptimeHuman: fmtUptime(process.uptime()),
    },
    disk: disk
      ? {
          ...disk,
          totalHuman: fmtBytes(disk.totalBytes),
          usedHuman: fmtBytes(disk.usedBytes),
          freeHuman: fmtBytes(disk.freeBytes),
        }
      : null,
    database: {
      status: dbState,
      ok: dbState === 'connected',
      stats: mongoStats,
    },
    pm2,
    swap: swap
      ? {
          ...swap,
          totalHuman: fmtBytes(swap.totalBytes),
          usedHuman: fmtBytes(swap.usedBytes),
          freeHuman: fmtBytes(swap.freeBytes),
        }
      : null,
    users,
    capacity,
    history: [...history],
    meta: {
      live: true,
      sampledAt: new Date().toISOString(),
      historyPoints: history.length,
      sources: {
        cpu: process.platform === 'linux' ? '/proc/stat' : 'os.loadavg',
        memory: 'os.totalmem / os.freemem',
        disk: process.platform === 'linux' ? 'df /' : 'unavailable',
        users: 'mongodb AnalyticsEvent + User',
        database: 'mongoose connection + db.stats()',
        process: 'process.memoryUsage() + pm2 jlist',
      },
    },
  };
}

module.exports = { collectServerMetrics };
