import test from "node:test";
import assert from "node:assert/strict";
import { cleanupNotBefore } from "../../lib/cms/cleanup-schedule";

test("discarded uploads retain cleanup beyond the signed token lifetime", () => {
  const queuedAt = new Date("2026-10-15T10:00:00Z");
  const eligibleAt = cleanupNotBefore(queuedAt);
  assert.ok(eligibleAt.getTime() > queuedAt.getTime() + 2 * 60 * 60 * 1000);
  assert.ok(eligibleAt.getTime() <= queuedAt.getTime() + 130 * 60 * 1000);
  assert.equal(queuedAt.toISOString(), "2026-10-15T10:00:00.000Z");
});
