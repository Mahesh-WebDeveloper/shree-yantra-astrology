// fcm.js — send push notifications DIRECTLY via Firebase Cloud Messaging (Admin SDK).
// No Expo push service in between: the app registers its native FCM device token and the
// server delivers straight to Google FCM using a service-account key.
//
// Setup: put the Firebase service-account JSON on the server and point FIREBASE_SERVICE_ACCOUNT
// at it (defaults to backend/firebase-service-account.json). If it's missing, sendFcm is a
// no-op (local notifications still work; server push just doesn't fire).

const path = require('path');

let messaging = null;
(function init() {
  try {
    // modular API (firebase-admin v12+) — the default export's `credential` can be undefined
    const { initializeApp, cert, getApps } = require('firebase-admin/app');
    const { getMessaging } = require('firebase-admin/messaging');
    const file = process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '..', '..', 'firebase-service-account.json');
    const svc = require(path.resolve(file));
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(svc) });
    messaging = getMessaging(app);
    console.log('✅ FCM ready (project:', svc.project_id + ')');
  } catch (e) {
    console.warn('⚠️  FCM not configured — server push disabled:', e.message);
  }
})();

const isReady = () => !!messaging;

/**
 * @param {string[]} tokens  native FCM device tokens
 * @param {{title:string, body:string, data?:object, channelId?:string}} msg
 * @returns {Promise<{sent:number, invalid:string[]}>}  invalid = tokens FCM says are dead
 */
async function sendFcm(tokens, { title, body, data, channelId } = {}) {
  if (!messaging) return { sent: 0, invalid: [] };
  const uniq = [...new Set((tokens || []).filter((t) => typeof t === 'string' && t.length > 20))];
  if (!uniq.length) return { sent: 0, invalid: [] };
  const strData = Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, String(v)]));
  let sent = 0;
  const invalid = [];
  for (let i = 0; i < uniq.length; i += 500) {
    const chunk = uniq.slice(i, i + 500);
    try {
      const res = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: strData,
        // channelId's own sound (bell) wins on Android 8+; `sound: 'bell'` covers older devices
        android: { priority: 'high', notification: { channelId: channelId || 'sy_general', color: '#e9b850', sound: 'bell' } },
      });
      sent += res.successCount;
      res.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = (r.error && r.error.code) || '';
          if (/registration-token-not-registered|invalid-argument|invalid-registration/.test(code)) invalid.push(chunk[idx]);
        }
      });
    } catch (_) { /* skip this chunk */ }
  }
  return { sent, invalid };
}

module.exports = { sendFcm, isReady };
