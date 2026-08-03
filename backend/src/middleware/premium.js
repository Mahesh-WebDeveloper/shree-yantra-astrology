const { refreshUserEntitlement } = require('../services/payment.service');

module.exports = async function requirePremium(req, res, next) {
  try {
    if (req.user?.role === 'admin') return next();
    const entitled = await refreshUserEntitlement(req.user);
    if (!entitled) {
      return res.status(402).json({
        error: 'An active subscription is required to use this feature.',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};
