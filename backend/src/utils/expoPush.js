// expoPush.js — send push notifications through Expo's free push service.
// Takes Expo push tokens (ExponentPushToken[...]) and POSTs to Expo in batches of 100.
// Delivery on Android requires FCM configured for the app; if not, Expo returns an error
// per-token which we simply ignore (the call itself never throws).

const EXPO_URL = 'https://exp.host/--/api/v2/push/send';

const isExpoToken = (t) => typeof t === 'string' && /^ExponentPushToken\[.+\]$/.test(t);

/**
 * @param {string[]} tokens  Expo push tokens
 * @param {{title:string, body:string, data?:object}} msg
 * @returns {Promise<{sent:number}>}
 */
async function sendPush(tokens, { title, body, data } = {}) {
  const valid = [...new Set((tokens || []).filter(isExpoToken))];
  if (!valid.length) return { sent: 0 };
  const messages = valid.map((to) => ({ to, sound: 'default', title, body, data: data || {}, channelId: 'default', priority: 'high' }));
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (res && res.ok) sent += chunk.length;
    } catch (_) { /* network / FCM not configured — skip this chunk */ }
  }
  return { sent };
}

module.exports = { sendPush, isExpoToken };
