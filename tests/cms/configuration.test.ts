import test from "node:test";
import assert from "node:assert/strict";
import { hasCmsConfiguration, isCmsPreviewMode } from "../../lib/cms/config";

test("unconfigured previews never become partially configured CMS sessions", () => {
  const names = ["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "CMS_OWNER_ID"];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.equal(isCmsPreviewMode(), true);
    assert.equal(hasCmsConfiguration(), false);
    process.env.CMS_OWNER_ID = "17f35d47-025b-4b42-b51c-a85ecc4d09d2";
    assert.equal(isCmsPreviewMode(), false);
    assert.equal(hasCmsConfiguration(), false);
    Object.assign(process.env, { DATABASE_URL: "postgresql://example:example@localhost:5432/test", DIRECT_URL: "postgresql://example:example@localhost:5432/test", NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key" });
    assert.equal(hasCmsConfiguration(), true);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "javascript:alert(1)";
    assert.equal(hasCmsConfiguration(), false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.CMS_OWNER_ID = "not-an-owner-uuid";
    assert.equal(hasCmsConfiguration(), false);
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});
