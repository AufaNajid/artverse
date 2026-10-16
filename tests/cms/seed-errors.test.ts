import test from "node:test";
import assert from "node:assert/strict";
import { seedFailureMessage } from "../../scripts/cms-seed-errors";

test("seed failures identify the pooler error without printing the raw database message", () => {
  const secret = "postgresql://owner:private-password@private-host/database";
  const result = seedFailureMessage({ message: `Error using ${secret}: prepared statement "s0" already exists` });
  assert.match(result, /POOLER_CONFIGURATION/);
  assert.equal(result.includes(secret), false);
  assert.equal(result.includes("private-password"), false);
});

test("seed failure diagnostics explain actionable setup failures and withhold unknown details", () => {
  assert.match(seedFailureMessage({ code: "P2021" }), /MIGRATIONS_REQUIRED/);
  assert.match(seedFailureMessage({ code: "P2028" }), /TRANSACTION_TIMEOUT/);
  assert.match(seedFailureMessage({ errorCode: "P1000" }), /DATABASE_AUTHENTICATION/);
  assert.match(seedFailureMessage({ code: "P1010" }), /DATABASE_PERMISSIONS/);
  assert.match(seedFailureMessage(new Error("CMS_OWNER_MISMATCH")), /OWNER_MISMATCH/);
  assert.match(seedFailureMessage(new Error("CMS_OWNER_ID_REQUIRED")), /OWNER_ID_REQUIRED/);
  assert.equal(seedFailureMessage(new Error("secret connection details")).includes("secret connection details"), false);
});
