const SESSION_KEY = 'sy.web.sessionId';

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `w-${crypto.randomUUID()}`;
  return `w-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function getOrCreateSessionId(): string {
  if (typeof sessionStorage === 'undefined') return newRequestId();
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `ws-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function correlationHeaders(): Record<string, string> {
  return {
    'X-Request-Id': newRequestId(),
    'X-Session-Id': getOrCreateSessionId(),
    'X-Platform': 'web',
    'X-App-Version': import.meta.env.VITE_APP_VERSION || 'website',
  };
}

export function lastRequestIdFromResponse(res: Response): string | null {
  return res.headers.get('x-request-id');
}
