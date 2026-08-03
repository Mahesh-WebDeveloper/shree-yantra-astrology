const Razorpay = require('razorpay');
const env = require('../config/env');

async function main() {
  if (!env.payments.razorpayKeyId || !env.payments.razorpayKeySecret) {
    throw new Error('Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET before running this script.');
  }
  const razorpay = new Razorpay({
    key_id: env.payments.razorpayKeyId,
    key_secret: env.payments.razorpayKeySecret,
  });
  const plans = await razorpay.plans.all({ count: 100 });
  const existing = (plans.items || []).find((plan) => (
    plan.period === 'monthly'
    && Number(plan.interval) === 1
    && Number(plan.item?.amount) === env.payments.monthlyAmountPaise
    && plan.item?.currency === env.payments.currency
    && plan.notes?.product === 'shree_yantra_premium_monthly'
  ));
  const plan = existing || await razorpay.plans.create({
    period: 'monthly',
    interval: 1,
    item: {
      name: 'Shree Yantra Premium Monthly',
      amount: env.payments.monthlyAmountPaise,
      currency: env.payments.currency,
      description: 'Monthly access to Shree Yantra Astrology premium features',
    },
    notes: { product: 'shree_yantra_premium_monthly' },
  });
  console.log(existing ? 'Existing matching plan found.' : 'New plan created.');
  console.log(`RAZORPAY_PLAN_ID=${plan.id}`);
}

main().catch((error) => {
  const provider = error?.error || error;
  console.error('Razorpay plan setup failed:', {
    statusCode: error?.statusCode || provider?.statusCode,
    code: provider?.code,
    description: provider?.description || provider?.message || error?.message || 'Unknown provider response',
  });
  process.exit(1);
});
