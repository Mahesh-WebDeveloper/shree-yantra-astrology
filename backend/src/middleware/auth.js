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
    if (!user) return res.status(401).json({ error: 'User nahi mila' });
    if (user.blocked) return res.status(401).json({ error: 'Account blocked hai' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expire ho gaya — dobara login karein' });
  }
};
