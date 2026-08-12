const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const PaymentSubscription = require('../models/PaymentSubscription');
const PaymentTransaction = require('../models/PaymentTransaction');
const PaymentWebhookEvent = require('../models/PaymentWebhookEvent');
const payments = require('../services/payment.service');

function notFound(message) {
  return Object.assign(new Error(message), { status: 404 });
}

function paiseToInr(paise) {
  return Math.round(Number(paise) || 0) / 100;
}

function formatUser(u) {
  if (!u) return null;
  return {
    id: String(u._id),
    name: u.name || '',
    email: u.email || '',
    phone: u.phone || '',
    plan: u.plan || 'free',
    createdAt: u.createdAt,
  };
}

function formatSubscription(s) {
  if (!s) return null;
  return {
    id: String(s._id),
    userId: String(s.user?._id || s.user),
    providerSubscriptionId: s.providerSubscriptionId || '',
    providerPlanId: s.providerPlanId || '',
    status: s.status,
    entitlementActive: !!s.entitlementActive,
    initialPeriodType: s.initialPeriodType || 'trial',
    trialConsumedAt: s.trialConsumedAt,
    checkoutVerifiedAt: s.checkoutVerifiedAt,
    startAt: s.startAt,
    currentPeriodStart: s.currentPeriodStart,
    currentPeriodEnd: s.currentPeriodEnd,
    nextChargeAt: s.nextChargeAt,
    accessUntil: s.accessUntil,
    cancelAtCycleEnd: !!s.cancelAtCycleEnd,
    cancellationRequestedAt: s.cancellationRequestedAt,
    paidCount: s.paidCount || 0,
    lastPaymentId: s.lastPaymentId || '',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function formatTransaction(t) {
  return {
    id: String(t._id),
    userId: String(t.user?._id || t.user),
    providerPaymentId: t.providerPaymentId,
    providerSubscriptionId: t.providerSubscriptionId || '',
    providerInvoiceId: t.providerInvoiceId || '',
    providerOrderId: t.providerOrderId || '',
    amountPaise: t.amountPaise,
    amountInr: paiseToInr(t.amountPaise),
    amountRefundedPaise: t.amountRefundedPaise || 0,
    currency: t.currency || 'INR',
    status: t.status,
    captured: !!t.captured,
    method: t.method || 'unknown',
    bank: t.bank || '',
    wallet: t.wallet || '',
    vpa: t.vpa || '',
    cardLast4: t.cardLast4 || '',
    cardNetwork: t.cardNetwork || '',
    email: t.email || '',
    contact: t.contact || '',
    feePaise: t.feePaise || 0,
    taxPaise: t.taxPaise || 0,
    description: t.description || '',
    errorCode: t.errorCode || '',
    errorDescription: t.errorDescription || '',
    isTrial: !!t.isTrial,
    billingPeriodType: t.billingPeriodType || 'unknown',
    eventType: t.eventType || '',
    capturedAt: t.capturedAt || t.createdAt,
    createdAt: t.createdAt,
  };
}

function paymentMethodLabel(t) {
  if (t.vpa) return `UPI · ${t.vpa}`;
  if (t.wallet) return `Wallet · ${t.wallet}`;
  if (t.cardNetwork) return `Card · ${t.cardNetwork}${t.cardLast4 ? ` ···${t.cardLast4}` : ''}`;
  if (t.bank) return `Netbanking · ${t.bank}`;
  return t.method || 'Unknown';
}

function segmentMatch(sub, segment) {
  if (!segment || segment === 'all') return true;
  const paid = sub.paidCount || 0;
  const trialDone = !!sub.trialConsumedAt;
  const active = !!sub.entitlementActive;
  switch (segment) {
    case 'trial_active':
      return active && sub.initialPeriodType === 'trial' && paid <= 1 && !['cancelled', 'expired', 'completed'].includes(sub.status);
    case 'trial_started':
      return trialDone;
    case 'converted':
      return paid >= 2 || (trialDone && sub.initialPeriodType === 'paid');
    case 'active_premium':
      return active && ['authenticated', 'active', 'pending'].includes(sub.status);
    case 'cancelled':
      return ['cancelled', 'expired', 'completed'].includes(sub.status) || sub.cancelAtCycleEnd;
    case 'never_subscribed':
      return false;
    default:
      return true;
  }
}

// GET /api/admin/subscriptions/overview
exports.overview = asyncHandler(async (req, res) => {
  const trialPaise = env.payments.trialAmountPaise;
  const monthlyPaise = env.payments.monthlyAmountPaise;

  const [
    subAgg,
    revenueAgg,
    methodAgg,
    dailyRevenue,
    topPayers,
    recentTransactions,
    webhookStats,
    oldestNewest,
  ] = await Promise.all([
    PaymentSubscription.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          activePremium: {
            $sum: { $cond: [{ $and: [{ $eq: ['$entitlementActive', true] }, { $in: ['$status', ['authenticated', 'active', 'pending']] }] }, 1, 0] },
          },
          trialActive: {
            $sum: {
              $cond: [{
                $and: [
                  { $eq: ['$entitlementActive', true] },
                  { $eq: ['$initialPeriodType', 'trial'] },
                  { $lte: ['$paidCount', 1] },
                ],
              }, 1, 0],
            },
          },
          trialStarted: { $sum: { $cond: [{ $ifNull: ['$trialConsumedAt', false] }, 1, 0] } },
          converted: { $sum: { $cond: [{ $gte: ['$paidCount', 2] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $in: ['$status', ['cancelled', 'expired', 'completed']] }, 1, 0] } },
        },
      },
    ]),
    PaymentTransaction.aggregate([
      { $match: { status: 'captured' } },
      {
        $group: {
          _id: null,
          totalPaise: { $sum: '$amountPaise' },
          trialPaise: { $sum: { $cond: ['$isTrial', '$amountPaise', 0] } },
          paidPaise: { $sum: { $cond: ['$isTrial', 0, '$amountPaise'] } },
          count: { $sum: 1 },
          trialCount: { $sum: { $cond: ['$isTrial', 1, 0] } },
          paidCount: { $sum: { $cond: ['$isTrial', 0, 1] } },
        },
      },
    ]),
    PaymentTransaction.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: '$method', count: { $sum: 1 }, totalPaise: { $sum: '$amountPaise' } } },
      { $sort: { count: -1 } },
    ]),
    PaymentTransaction.aggregate([
      { $match: { status: 'captured', capturedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$capturedAt', timezone: 'Asia/Kolkata' } },
          totalPaise: { $sum: '$amountPaise' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    PaymentTransaction.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: '$user', totalPaise: { $sum: '$amountPaise' }, payments: { $sum: 1 } } },
      { $sort: { totalPaise: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ]),
    PaymentTransaction.find({ status: 'captured' })
      .sort({ capturedAt: -1 })
      .limit(8)
      .populate('user', 'name email phone')
      .lean(),
    PaymentWebhookEvent.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    PaymentSubscription.find({ checkoutVerifiedAt: { $exists: true } })
      .sort({ checkoutVerifiedAt: 1 })
      .limit(1)
      .populate('user', 'name email')
      .lean()
      .then(async (oldest) => {
        const newest = await PaymentSubscription.find({ checkoutVerifiedAt: { $exists: true } })
          .sort({ checkoutVerifiedAt: -1 })
          .limit(1)
          .populate('user', 'name email')
          .lean();
        return { oldest: oldest[0], newest: newest[0] };
      }),
  ]);

  const s = subAgg[0] || {};
  const r = revenueAgg[0] || {};
  const conversionRate = (s.trialStarted || 0) > 0
    ? Math.round(((s.converted || 0) / s.trialStarted) * 100)
    : 0;

  res.json({
    at: new Date().toISOString(),
    pricing: {
      trialInr: paiseToInr(trialPaise),
      trialDays: env.payments.trialDays,
      monthlyInr: paiseToInr(monthlyPaise),
      currency: env.payments.currency,
    },
    subscriptions: {
      total: s.total || 0,
      activePremium: s.activePremium || 0,
      trialActive: s.trialActive || 0,
      trialStarted: s.trialStarted || 0,
      convertedAfterTrial: s.converted || 0,
      conversionRatePercent: conversionRate,
      cancelled: s.cancelled || 0,
    },
    revenue: {
      totalInr: paiseToInr(r.totalPaise || 0),
      totalPaise: r.totalPaise || 0,
      trialInr: paiseToInr(r.trialPaise || 0),
      recurringInr: paiseToInr(r.paidPaise || 0),
      transactionCount: r.count || 0,
      trialPayments: r.trialCount || 0,
      recurringPayments: r.paidCount || 0,
    },
    paymentMethods: methodAgg.map((m) => ({
      method: m._id || 'unknown',
      count: m.count,
      totalInr: paiseToInr(m.totalPaise),
    })),
    dailyRevenue: dailyRevenue.map((d) => ({
      date: d._id,
      totalInr: paiseToInr(d.totalPaise),
      count: d.count,
    })),
    topPayers: topPayers.map((p) => ({
      user: formatUser(p.user),
      totalInr: paiseToInr(p.totalPaise),
      payments: p.payments,
    })),
    recentTransactions: recentTransactions.map((t) => ({
      ...formatTransaction(t),
      user: formatUser(t.user),
      methodLabel: paymentMethodLabel(t),
    })),
    webhooks: Object.fromEntries((webhookStats || []).map((w) => [w._id, w.count])),
    milestones: {
      firstSubscriber: oldestNewest.oldest ? {
        user: formatUser(oldestNewest.oldest.user),
        at: oldestNewest.oldest.checkoutVerifiedAt,
      } : null,
      latestSubscriber: oldestNewest.newest ? {
        user: formatUser(oldestNewest.newest.user),
        at: oldestNewest.newest.checkoutVerifiedAt,
      } : null,
    },
  });
});

// GET /api/admin/subscriptions
exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const segment = String(req.query.segment || '').trim();
  const sort = String(req.query.sort || 'updatedAt:desc');

  const [sortField, sortDir] = sort.split(':');
  const sortSpec = { [sortField === 'paidTotal' ? 'paidCount' : (sortField || 'updatedAt')]: sortDir === 'asc' ? 1 : -1 };

  let userFilter = {};
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      $or: [{ name: re }, { email: re }, { phone: re }],
    }).select('_id').limit(200).lean();
    userFilter = { user: { $in: users.map((u) => u._id) } };
  }

  const baseFilter = { ...userFilter };
  if (status) baseFilter.status = status;

  const all = await PaymentSubscription.find(baseFilter)
    .populate('user', 'name email phone plan createdAt')
    .sort(sortSpec)
    .lean();

  const filtered = segment && segment !== 'all'
    ? all.filter((s) => segmentMatch(s, segment))
    : all;

  const userIds = filtered.map((s) => s.user?._id || s.user);
  const totals = await PaymentTransaction.aggregate([
    { $match: { user: { $in: userIds }, status: 'captured' } },
    { $group: { _id: '$user', totalPaise: { $sum: '$amountPaise' }, count: { $sum: 1 }, lastAt: { $max: '$capturedAt' } } },
  ]);
  const totalMap = Object.fromEntries(totals.map((t) => [String(t._id), t]));

  const enriched = filtered.map((s) => {
    const uid = String(s.user?._id || s.user);
    const agg = totalMap[uid] || {};
    return {
      subscription: formatSubscription(s),
      user: formatUser(s.user),
      totalPaidInr: paiseToInr(agg.totalPaise || 0),
      paymentCount: agg.count || 0,
      lastPaymentAt: agg.lastAt || null,
      segment: (() => {
        if (s.paidCount >= 2) return 'converted';
        if (s.entitlementActive && s.initialPeriodType === 'trial' && (s.paidCount || 0) <= 1) return 'trial_active';
        if (s.trialConsumedAt) return 'trial_started';
        if (['cancelled', 'expired', 'completed'].includes(s.status)) return 'cancelled';
        if (s.entitlementActive) return 'active_premium';
        return 'other';
      })(),
    };
  });

  if (sortField === 'paidTotal') {
    enriched.sort((a, b) => (sortDir === 'asc' ? 1 : -1) * ((a.totalPaidInr || 0) - (b.totalPaidInr || 0)));
  }

  const total = enriched.length;
  const start = (page - 1) * limit;
  const rows = enriched.slice(start, start + limit);

  res.json({
    subscriptions: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/admin/subscriptions/:userId
exports.detail = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid user id' });

  const [user, sub, transactions] = await Promise.all([
    User.findById(userId).lean(),
    PaymentSubscription.findOne({ user: userId }).lean(),
    PaymentTransaction.find({ user: userId }).sort({ capturedAt: -1, createdAt: -1 }).lean(),
  ]);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const hooks = sub?.providerSubscriptionId
    ? await PaymentWebhookEvent.find({ providerSubscriptionId: sub.providerSubscriptionId }).sort({ createdAt: -1 }).limit(20).lean()
    : [];

  const totalPaise = transactions.filter((t) => t.status === 'captured').reduce((sum, t) => sum + (t.amountPaise || 0), 0);

  res.json({
    user: formatUser(user),
    subscription: formatSubscription(sub),
    summary: {
      totalPaidInr: paiseToInr(totalPaise),
      paymentCount: transactions.length,
      trialPayments: transactions.filter((t) => t.isTrial).length,
      recurringPayments: transactions.filter((t) => !t.isTrial && t.status === 'captured').length,
    },
    transactions: transactions.map((t) => ({ ...formatTransaction(t), methodLabel: paymentMethodLabel(t) })),
    webhooks: hooks.map((w) => ({
      id: String(w._id),
      eventType: w.eventType,
      status: w.status,
      providerSubscriptionId: w.providerSubscriptionId || '',
      error: w.error || '',
      createdAt: w.createdAt,
      processedAt: w.processedAt,
    })),
  });
});

// GET /api/admin/payments/transactions
exports.listTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const search = String(req.query.search || '').trim();
  const method = String(req.query.method || '').trim();
  const status = String(req.query.status || '').trim();
  const isTrial = req.query.isTrial;
  const sort = String(req.query.sort || 'capturedAt:desc');
  const [sortField, sortDir] = sort.split(':');

  const filter = {};
  if (method) filter.method = method;
  if (status) filter.status = status;
  if (isTrial === 'true') filter.isTrial = true;
  if (isTrial === 'false') filter.isTrial = false;

  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({ $or: [{ name: re }, { email: re }, { phone: re }] }).select('_id').limit(200).lean();
    filter.$or = [
      { user: { $in: users.map((u) => u._id) } },
      { providerPaymentId: re },
      { providerSubscriptionId: re },
      { vpa: re },
    ];
  }

  const total = await PaymentTransaction.countDocuments(filter);
  const rows = await PaymentTransaction.find(filter)
    .populate('user', 'name email phone')
    .sort({ [sortField || 'capturedAt']: sortDir === 'asc' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.json({
    transactions: rows.map((t) => ({
      ...formatTransaction(t),
      user: formatUser(t.user),
      methodLabel: paymentMethodLabel(t),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// POST /api/admin/subscriptions/:userId/sync — pull latest Razorpay state
exports.adminSync = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.userId)) throw notFound('User not found');
  const user = await User.findById(req.params.userId);
  if (!user) throw notFound('User not found');
  const subscription = await payments.getStatus(user, { sync: true });
  const freshUser = await User.findById(user._id);
  res.json({ user: formatUser(freshUser), subscription });
});

// POST /api/admin/subscriptions/:userId/cancel — admin-initiated cancel
exports.adminCancel = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.userId)) throw notFound('User not found');
  const user = await User.findById(req.params.userId);
  if (!user) throw notFound('User not found');
  const result = await payments.cancelSubscription(user);
  res.json({
    user: formatUser(result.user),
    subscription: result.subscription,
  });
});
