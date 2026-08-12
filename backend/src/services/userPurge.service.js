'use strict';

const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const ChatMessage = require('../models/ChatMessage');
const UserData = require('../models/UserData');
const PaymentSubscription = require('../models/PaymentSubscription');
const PaymentTransaction = require('../models/PaymentTransaction');
const ObservabilityLog = require('../models/ObservabilityLog');
const ApiRequestMetric = require('../models/ApiRequestMetric');
const ObservabilityErrorGroup = require('../models/ObservabilityErrorGroup');

/** Remove or anonymize user-linked data when an account is deleted from admin. */
async function purgeUserData(userId) {
  const id = new mongoose.Types.ObjectId(String(userId));
  const [analytics, chat, userData, subs, txns, logs, metrics, errorGroups] = await Promise.all([
    AnalyticsEvent.deleteMany({ user: id }),
    ChatMessage.deleteMany({ user: id }),
    UserData.deleteMany({ user: id }),
    PaymentSubscription.deleteMany({ user: id }),
    PaymentTransaction.deleteMany({ user: id }),
    ObservabilityLog.updateMany({ user_id: id }, { $set: { user_id: null, message: '[user deleted — redacted]' } }),
    ApiRequestMetric.updateMany({ user_id: id }, { $unset: { user_id: 1 } }),
    ObservabilityErrorGroup.updateMany({ affected_user_ids: id }, { $pull: { affected_user_ids: id } }),
  ]);
  return {
    analyticsEvents: analytics.deletedCount || 0,
    chatMessages: chat.deletedCount || 0,
    userData: userData.deletedCount || 0,
    subscriptions: subs.deletedCount || 0,
    transactions: txns.deletedCount || 0,
    logsAnonymized: logs.modifiedCount || 0,
    metricsAnonymized: metrics.modifiedCount || 0,
    errorGroupsUpdated: errorGroups.modifiedCount || 0,
  };
}

module.exports = { purgeUserData };
