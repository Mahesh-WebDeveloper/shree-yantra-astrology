import { OTPWidget } from './msg91Sdk';

const WIDGET_ID = process.env.EXPO_PUBLIC_MSG91_WIDGET_ID || '';
const WIDGET_TOKEN = process.env.EXPO_PUBLIC_MSG91_WIDGET_TOKEN || '';

type ProviderResponse = {
  type?: string;
  status?: string;
  message?: string;
  code?: string | number;
  invisibleVerified?: boolean;
  'access-token'?: string;
  accessToken?: string;
  data?: any;
};

export type WidgetRuntimeConfig = {
  otpLength: number;
  resendAfterSeconds: number;
  expirySeconds: number;
};

let initialized = false;

function assertConfigured() {
  if (!WIDGET_ID || !WIDGET_TOKEN) {
    throw new Error('Mobile verification is not configured in this app build.');
  }
}

function isSuccess(response: ProviderResponse | undefined) {
  return response?.type === 'success' || response?.status === 'success';
}

function safeError(response: ProviderResponse | undefined, fallback: string) {
  const message = String(response?.message || '').toLowerCase();
  const makeError = (text: string, code: string) => {
    const error = new Error(text) as Error & { code?: string };
    error.code = code;
    return error;
  };
  if (/expired/.test(message)) return makeError('The OTP has expired. Please request a new OTP.', 'OTP_EXPIRED');
  if (/invalid|incorrect|mismatch|wrong/.test(message)) return makeError('The OTP is incorrect. Please try again.', 'OTP_INVALID');
  if (/limit|attempt|retry/.test(message)) return makeError('Too many attempts. Please wait and try again.', 'OTP_ATTEMPTS_EXCEEDED');
  return makeError(fallback, 'OTP_PROVIDER_REJECTED');
}

function accessToken(response: ProviderResponse | undefined, allowMessage = false) {
  const token = response?.['access-token'] || response?.accessToken || response?.data?.['access-token'] || response?.data?.accessToken;
  if (typeof token === 'string' && token.length >= 20) return token;
  if (allowMessage && typeof response?.message === 'string' && response.message.length >= 20) return response.message;
  return null;
}

export async function initializeMsg91Widget(): Promise<WidgetRuntimeConfig> {
  assertConfigured();
  if (!initialized) {
    await OTPWidget.initializeWidget(WIDGET_ID, WIDGET_TOKEN);
    initialized = true;
  }

  const defaults = { otpLength: 4, resendAfterSeconds: 60, expirySeconds: 5 * 60 };
  try {
    const response: any = await OTPWidget.getWidgetProcess();
    const data = response?.data?.data || response?.data || {};
    if ((response?.status === 'success' || response?.type === 'success') && Number(data.mobileIntegration) !== 1) {
      throw new Error('MSG91 Mobile Integration is disabled for this OTP widget.');
    }
    const otpLength = Number(data.otpLength);
    const retryTime = Number(data.retryTime);
    const expiryMinutes = Number(data.expiryTime);
    return {
      otpLength: otpLength >= 4 && otpLength <= 8 ? otpLength : defaults.otpLength,
      resendAfterSeconds: retryTime >= 10 && retryTime <= 300 ? retryTime : defaults.resendAfterSeconds,
      expirySeconds: expiryMinutes >= 1 && expiryMinutes <= 60 ? expiryMinutes * 60 : defaults.expirySeconds,
    };
  } catch (error: any) {
    if (/Mobile Integration is disabled/i.test(String(error?.message || ''))) throw error;
    return defaults;
  }
}

export async function sendMsg91WidgetOtp(identifier: string) {
  await initializeMsg91Widget();
  const response: ProviderResponse = await OTPWidget.sendOTP({ identifier });
  if (!isSuccess(response)) throw safeError(response, 'OTP could not be sent. Please try again.');

  const automaticallyVerified = response.invisibleVerified === true || !!response['access-token'];
  if (automaticallyVerified) {
    const token = accessToken(response, true);
    if (!token) throw new Error('Automatic mobile verification could not be completed. Please request an OTP.');
    return { accessToken: token, requestId: null };
  }

  const requestId = typeof response.message === 'string' ? response.message : '';
  if (!requestId) throw new Error('OTP verification session could not be created. Please try again.');
  return { accessToken: null, requestId };
}

export async function verifyMsg91WidgetOtp(requestId: string, otp: string) {
  await initializeMsg91Widget();
  const response: ProviderResponse = await OTPWidget.verifyOTP({ reqId: requestId, otp });
  if (!isSuccess(response)) throw safeError(response, 'OTP could not be verified. Please try again.');
  const token = accessToken(response, true);
  if (!token) throw new Error('Verified session token was not received. Please request a new OTP.');
  return token;
}

export async function retryMsg91WidgetOtp(requestId: string) {
  await initializeMsg91Widget();
  const response: ProviderResponse = await OTPWidget.retryOTP({ reqId: requestId, retryChannel: 11 });
  if (!isSuccess(response)) throw safeError(response, 'OTP could not be resent. Please try again.');
  return typeof response.message === 'string' && response.message ? response.message : requestId;
}
