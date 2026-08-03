const asyncHandler = require('../middleware/asyncHandler');
const payments = require('../services/payment.service');

exports.config = (req, res) => res.json(payments.getPublicConfig());

exports.createSubscription = asyncHandler(async (req, res) => {
  res.status(201).json(await payments.createSubscription(req.user));
});

exports.verify = asyncHandler(async (req, res) => {
  res.json(await payments.verifyCheckout(req.user, req.body || {}));
});

exports.status = asyncHandler(async (req, res) => {
  res.json(await payments.getStatus(req.user, { sync: true }));
});

exports.cancel = asyncHandler(async (req, res) => {
  res.json(await payments.cancelSubscription(req.user));
});

exports.webhook = asyncHandler(async (req, res) => {
  const result = await payments.handleWebhook(req.body, req.headers);
  res.status(200).json({ ok: true, duplicate: result.duplicate });
});
