// Supabase signed upload URLs remain usable for two hours. A deleted object
// must not be recreated with an outstanding token after its cleanup job is gone.
const SIGNED_UPLOAD_LIFETIME_MS = 2 * 60 * 60 * 1000;
const CLOCK_MARGIN_MS = 5 * 60 * 1000;

export function cleanupNotBefore(queuedAt = new Date()): Date {
  return new Date(queuedAt.getTime() + SIGNED_UPLOAD_LIFETIME_MS + CLOCK_MARGIN_MS);
}
