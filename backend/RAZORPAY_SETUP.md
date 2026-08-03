# Razorpay Subscription Setup

The implemented billing contract is:

- INR 1 authorization and trial charge at checkout.
- Seven days of access after the mandate is authenticated.
- INR 499 charged every month, starting after the trial.
- The INR 1 trial is one-time per account. A returning subscriber pays INR 499 for the first month at checkout, then recurring billing starts one calendar month later.
- Cancellation during the trial is immediate. Cancellation after paid billing starts is scheduled for the end of the current paid period.

All entitlement decisions are made by the backend. The mobile app never receives the Razorpay key secret and never grants itself premium access.

## Test Mode

1. In Razorpay Dashboard, switch to Test Mode and generate a fresh Key ID and Key Secret.
2. Set the following backend environment variables. Do not expose them through Expo or commit them to Git.

   ```env
   PAYMENTS_ENABLED=true
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   RAZORPAY_PLAN_ID=
   RAZORPAY_WEBHOOK_SECRET=use-a-separate-random-secret
   RAZORPAY_TOTAL_BILLING_CYCLES=1200
   RAZORPAY_CHECKOUT_EXPIRY_MINUTES=30
   ```

3. Create or reuse the INR 499 monthly Test Mode plan:

   ```powershell
   npm run setup:razorpay-plan
   ```

4. Copy the returned plan ID to `RAZORPAY_PLAN_ID`, then restart the backend.
5. Create a Razorpay webhook pointing to:

   ```text
   https://YOUR_API_HOST/api/payments/razorpay/webhook
   ```

6. Use a webhook secret that is different from the API key secret. Subscribe to all subscription lifecycle events, including authenticated, activated, charged, pending, halted, cancelled, completed, paused, and resumed.

The credential supplied during development returned HTTP 401 from Razorpay and has also been exposed in chat. Revoke it and generate a new Test Mode key before testing checkout.

## Required Tests

- Successful UPI Autopay or supported mandate checkout charges INR 1 and grants access only after server verification.
- Closing checkout does not grant access.
- Invalid or replayed checkout signatures do not grant access.
- Duplicate webhook delivery remains idempotent.
- A successful checkout followed by a lost mobile verification response is recovered from the signed `subscription.authenticated` webhook or the paid subscription invoice.
- A failed monthly charge moves the subscription through Razorpay's pending/halted lifecycle and the app follows the server entitlement.
- Trial cancellation removes access immediately and prevents the INR 499 charge.
- Paid cancellation keeps access only through the current paid period.
- Logout, reinstall, cache clearing, clock changes, and direct navigation cannot bypass the server entitlement.

## Live Mode

1. Complete Razorpay account activation and KYC, and enable Subscriptions plus the required recurring payment methods.
2. Generate new Live Mode keys. Test keys, test plan IDs, and test webhooks cannot be reused in Live Mode.
3. Create the INR 499 monthly plan again in Live Mode and configure a separate live webhook and secret.
4. Serve the API only over HTTPS. Keep production database backups and monitor failed webhook records and Razorpay subscription states.
5. Set `NODE_ENV=production`. The server intentionally refuses to start with a Test Mode Razorpay key in production.
6. Build a release-signed APK/AAB and test the complete flow with a controlled live account before rollout.

## Google Play Distribution

For a directly distributed APK, Razorpay Checkout can be the app's billing flow. For a Google Play-distributed app selling digital access in India, Razorpay-only billing is not automatically compliant. Enrol in Google Play's applicable alternative billing program, show the required user-choice experience, and report alternative transactions within Google's required timeframe. Complete this policy integration before publishing the Razorpay build to Google Play.

Official references:

- https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/integration-steps-android/
- https://razorpay.com/docs/payments/subscriptions/integration-guide/
- https://razorpay.com/docs/payments/subscriptions/create/
- https://razorpay.com/docs/webhooks/validate-test/
- https://razorpay.com/docs/payments/subscriptions/supported-payment-methods/
- https://support.google.com/googleplay/android-developer/answer/13306652
- https://developer.android.com/google/play/billing/alternative/alternative-billing-with-user-choice-in-app
