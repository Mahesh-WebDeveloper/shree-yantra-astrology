// JWT auth guard — protected routes par lagता hai.
// "Authorization: Bearer <token>" header se user nikalta hai aur req.user set karta hai.
const { verifyToken, getUserById } = require('../services/auth.service');

module.exports = async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Login zaroori hai (token missing)' });

    const payload = verifyToken(token);
    const user = await getUserById(payload.sub);
    // AUTH_INVALID → app force-logout kare. Account DB se delete ho gaya (ya blocked)
    // par purana token device par pada tha → app "logged in" dikhta rehta tha.
    if (!user) return res.status(401).json({ error: 'Aapka account ab maujood nahi hai — dobara login karein.', code: 'AUTH_INVALID' });
    if (user.blocked) return res.status(401).json({ error: 'Account blocked hai', code: 'AUTH_INVALID' });

    // SINGLE-DEVICE ENFORCEMENT (server-side, non-bypassable): the token is only
    // valid if its session id matches the user's current activeSessionId. A newer
    // login on another device rotates activeSessionId, so this token stops working.
    // (Legacy tokens issued before this feature have no sid and the user has no
    // activeSessionId yet → allowed until their next login sets one, at which point
    // every other device is instantly logged out.)
    // Admins are exempt (web dashboard + app can coexist); enforce only for app users.
    if (user.role !== 'admin' && user.activeSessionId && payload.sid !== user.activeSessionId) {
      return res.status(401).json({
        error: 'Aapka account kisi doosre device par login hua hai — is device se logout kar diya gaya.',
        code: 'SESSION_REVOKED',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expire ho gaya — dobara login karein' });
  }
};
