import { createHash } from "node:crypto";
import { CmsError } from "./cms-error";
import { prisma } from "./db";

export function assertSameOrigin(request: Request) {
  const reject = () => { throw new CmsError("This request must come from the portfolio website.", 403); };
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site") return reject();
  try {
    const requestUrl = new URL(request.url);
    // Next's development adapter may normalize request.url to localhost while the
    // browser is visiting 127.0.0.1. Host retains the actual incoming authority;
    // browsers cannot forge it through fetch. Do not trust X-Forwarded-Host here.
    const host = request.headers.get("host") ?? requestUrl.host;
    if (!/^[A-Za-z0-9.:[\]-]+$/.test(host) || !["http:", "https:"].includes(requestUrl.protocol)) return reject();
    const incoming = new URL(`${requestUrl.protocol}//${host}`);
    let expected = incoming.origin;
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (site) {
      const canonical = new URL(site);
      // A canonical HTTPS URL also handles a trusted proxy terminating TLS. It
      // applies only to this exact Host; it is never an additional allowed origin.
      if (canonical.host === incoming.host && ["http:", "https:"].includes(canonical.protocol)) expected = canonical.origin;
    }
    if (new URL(origin).origin !== origin || origin !== expected) return reject();
  } catch (error) {
    if (error instanceof CmsError) throw error;
    return reject();
  }
}

export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new CmsError("Send a JSON request.", 415);
  if (Number(request.headers.get("content-length") ?? "0") > 128 * 1024) throw new CmsError("This request is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new CmsError("Send a JSON request body.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 128 * 1024) { await reader.cancel(); throw new CmsError("This request is too large.", 413); }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(text) as unknown; } catch { throw new CmsError("The request contains invalid JSON.", 400); }
}

export async function enforceRateLimit(namespace: string, identity: string, limit: number, windowSeconds: number) {
  const now = new Date();
  const bucket = Math.floor(now.getTime() / (windowSeconds * 1000));
  const digest = createHash("sha256").update(`${namespace}:${identity}:${bucket}`).digest("hex");
  const record = await prisma.cmsRateLimit.upsert({ where: { key: digest }, create: { key: digest, count: 1, resetAt: new Date((bucket + 1) * windowSeconds * 1000) }, update: { count: { increment: 1 } } });
  if (record.count > limit) throw new CmsError("Too many attempts. Please wait a few minutes and try again.", 429);
  // Bounded cleanup of expired counters; failures do not change the authorization result.
  void prisma.cmsRateLimit.deleteMany({ where: { resetAt: { lt: new Date(now.getTime() - 86400000) } } }).catch(() => undefined);
}
