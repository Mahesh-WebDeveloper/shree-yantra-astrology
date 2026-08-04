export function isAuthError(err: unknown): boolean {
  return (err as Error & { status?: number })?.status === 401
}
