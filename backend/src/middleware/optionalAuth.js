// Optional JWT auth — token ho to req.user set kar deta hai, na ho (ya galat ho) to bhi
// request aage jaati hai. Public endpoints par lagता hai jinhe "logged-in ho to extra
// kaam karo" chahiye — jaise ask-astrologer: jawab sabko milta hai, par login user ka
// chat history save hota hai. Single-device session rule yahan bhi lagu hai.
const { verifyToken, getUserById } = require('../services/auth.service');

module.exports = async function optionalAuth(req, _res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return next();

    const payload = verifyToken(token);
    const user = await getUserById(payload.sub);
    if (!user || user.blocked) return next();
    // revoked session (doosre device par login) → anonymous maano
    if (user.role !== 'admin' && user.activeSessionId && payload.sid !== user.activeSessionId) return next();

    req.user = user;
  } catch (_) {
    // invalid/expired token → chup-chaap anonymous
  }
  next();
};
