# MSG91 OTP Authentication

## Architecture

The mobile app uses the official MSG91 React Native Widget SDK with the existing
Shree Yantra UI. The SDK sends/retries/verifies the OTP and returns a short-lived
MSG91 access-token. The app does not become authenticated from that client result.
It sends the token and entered mobile number to the backend, which calls MSG91
`POST /api/v5/widget/verifyAccessToken` using the private `MSG91_AUTHKEY`. Only
after MSG91 confirms the identifier does the backend issue the existing Shree
Yantra JWT and rotate the single-device session ID.

The backend stores only token/phone HMAC hashes to prevent access-token replay.
It never stores an OTP or widget access-token in plaintext.

Legacy `/auth/send-otp`, `/auth/resend-otp`, and `/auth/verify-otp` routes remain
available for older clients and the website. They continue to use the server-side
MSG91 OTP API and require `MSG91_OTP_TEMPLATE_ID`.

## Backend environment

Required for widget-token verification:

```dotenv
MSG91_AUTHKEY=
```

Required only while legacy direct-OTP endpoints are enabled:

```dotenv
MSG91_OTP_TEMPLATE_ID=
MSG91_DLT_TEMPLATE_ID=1277178618551233526
MSG91_SENDER_ID=SYASTY
MSG91_PE_ID=1201178573075062694
```

Mobile build environment (client widget credentials, never the private Authkey):

```dotenv
EXPO_PUBLIC_MSG91_WIDGET_ID=
EXPO_PUBLIC_MSG91_WIDGET_TOKEN=
```

The widget token is intended for the MSG91 client SDK. `MSG91_AUTHKEY` remains
backend-only and must never use an `EXPO_PUBLIC_*`, `VITE_*`, or client variable.

The value must be the OTP template ID shown in the MSG91 OTP dashboard, not an
SMS-template ID and not the Jio DLT template ID. `MSG91_TEMPLATE_ID` is not used
because older deployments of this project stored a normal SMS-template ID there.

Security controls have production-safe defaults and can be overridden with the
variables documented in `backend/.env.example`.

## API contracts

Current mobile completion endpoint:

```http
POST /api/auth/msg91-widget/verify
Content-Type: application/json

{"mobile":"+919876543210","accessToken":"short-lived-msg91-token","lang":"en"}
```

The backend validates the access-token with MSG91, requires the returned mobile
to match the submitted canonical mobile, consumes the token once, and returns the
normal Shree Yantra JWT/user response.

Legacy direct-OTP endpoints:

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
8. Accept the operating-system OTP autofill suggestion if shown. When all four
   digits reach the input, verification and login happen automatically.
9. Test wrong OTP, expiry, five failed attempts, resend cooldown, and request caps.

The mobile app reads OTP length and expiry from the published widget at runtime.
Set the widget expiry to `5` minutes when a five-minute validity window is desired.
After that window the app starts a fresh OTP request; it does not retry an expired
`reqId`. Dashboard changes are picked up without rebuilding the APK.

## Automatic OTP entry limitation

The app enables Android/iOS OTP autofill and automatically verifies a complete
four-digit code. Guaranteed Android zero-touch SMS Retriever requires an app hash
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
