/**
 * Request correlation headers for API tracing.
 * Never include secrets — only IDs and safe device metadata.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'sy.obs.sessionId';

let cachedSessionId: string | null = null;

export async function getOrCreateSessionId(): Promise<string> {
  if (cachedSessionId) return cachedSessionId;
  let id = await AsyncStorage.getItem(SESSION_KEY).catch(() => null);
  if (!id) {
    id = `s-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    await AsyncStorage.setItem(SESSION_KEY, id).catch(() => {});
  }
  cachedSessionId = id;
  return id;
}

export function newRequestId(): string {
  return `m-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

let appVersion = '1.0.0';
try {
  appVersion = require('../../app.json')?.expo?.version || '1.0.0';
} catch {
  /* ignore */
}

export async function correlationHeaders(): Promise<Record<string, string>> {
  const sessionId = await getOrCreateSessionId();
  const headers: Record<string, string> = {
    'X-Request-Id': newRequestId(),
    'X-Session-Id': sessionId,
    'X-Platform': Platform.OS,
    'X-App-Version': appVersion,
    'X-OS-Version': String(Platform.Version),
  };
  try {
    const c = (Platform as any).constants;
    if (c?.Brand) headers['X-Device-Brand'] = String(c.Brand);
    if (c?.Model) headers['X-Device-Model'] = String(c.Model);
  } catch {
    /* ignore */
  }
  return headers;
}

export function lastRequestIdFromResponse(res: Response): string | null {
  return res.headers.get('x-request-id') || res.headers.get('X-Request-Id');
}
