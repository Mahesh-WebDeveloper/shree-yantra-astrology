# MSG91 OTP Authentication

## Architecture

The mobile app and website call the Shree Yantra backend. Only the backend calls
MSG91. `MSG91_AUTHKEY` must never be placed in an Expo, Vite, React Native, or
browser environment variable.

Flow:

1. `POST /api/auth/send-otp` validates and canonicalizes the Indian number.
2. The backend creates a cryptographically random six-digit OTP and submits it to
   MSG91 using the configured MSG91 OTP template. The approved `##number##`
   variable receives this OTP.
3. The backend stores only a hashed phone identifier and an opaque application
   request ID. It never stores the plaintext OTP.
4. `POST /api/auth/verify-otp` asks MSG91 to verify the OTP, then issues the
   existing application JWT and rotates the existing single-device session ID.
5. New users continue through the existing subscription/profile onboarding flow.

## Backend environment

Required:

```dotenv
MSG91_AUTHKEY=
MSG91_OTP_TEMPLATE_ID=
MSG91_DLT_TEMPLATE_ID=1277178618551233526
MSG91_SENDER_ID=SYASTY
MSG91_PE_ID=1201178573075062694
```

`MSG91_TEMPLATE_ID` remains supported as a legacy alias for
`MSG91_OTP_TEMPLATE_ID`. The value must be the OTP template ID shown in the MSG91
OTP dashboard, not the Jio DLT template ID.

Security controls have production-safe defaults and can be overridden with the
variables documented in `backend/.env.example`.

## API contracts

```http
POST /api/auth/send-otp
Content-Type: application/json

{"mobile":"+919876543210","lang":"en"}
```

```http
POST /api/auth/resend-otp
Content-Type: application/json

{"mobile":"+919876543210","requestId":"opaque-id","lang":"en"}
```

```http
POST /api/auth/verify-otp
Content-Type: application/json

{"mobile":"+919876543210","otp":"123456","requestId":"opaque-id","lang":"en"}
```

The OTP shown above is documentation-only. APIs never return an OTP.

## Real-device test

1. Keep MSG91 Authkey IP security enabled and whitelist only `168.144.185.66`.
2. Confirm `Authentication_OTP` is active in MSG91 and mapped to sender `SYASTY`,
   DLT template `1277178618551233526`, and the approved message body.
3. Confirm the MSG91 account has usable OTP/SMS credits or an active plan.
4. Deploy the backend environment and code to the whitelisted server.
5. Restart the backend and confirm `/api/health` succeeds.
6. Use a release or development-client APK pointed at the HTTPS production/staging
   API. Enter a real Indian mobile number and tap Send OTP.
7. Confirm the received SMS exactly matches the approved DLT content.
8. Accept the operating-system OTP autofill suggestion if shown. When all six
   digits reach the input, verification and login happen automatically.
9. Test wrong OTP, expiry, five failed attempts, resend cooldown, and request caps.

## Automatic OTP entry limitation

The app enables Android/iOS OTP autofill and automatically verifies a complete
six-digit code. Guaranteed Android zero-touch SMS Retriever requires an app hash
inside the approved SMS template and a stable production signing certificate.
The currently approved DLT message has no app hash, so adding a hidden SMS-reading
permission or silently changing the message would be insecure and could violate
Play policy/DLT matching. To enable guaranteed zero-touch retrieval later, first
finalize production signing, calculate the app hash, and approve a new matching
DLT/MSG91 template before adding the native Retriever integration.

## Production transport

OTP and JWT traffic must use HTTPS. If the Node process remains on port 4000,
terminate TLS at a reverse proxy/load balancer and expose only the HTTPS API to
mobile clients. Do not consider a plain `http://168.144.185.66:4000` endpoint a
production-ready authentication transport.
