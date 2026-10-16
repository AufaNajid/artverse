import assert from "node:assert/strict";

const origin = process.argv[2] || "http://127.0.0.1:3000";
const allowUnconfigured = process.argv.includes("--allow-unconfigured");
const deniedStatuses = allowUnconfigured ? [401, 503] : [401];
const id = "fa7595db-0b96-4d3f-8a7b-90104ff9ec4e";
const cases = [
  ["GET", "/api/artworks?scope=owner"],
  ["GET", `/api/artworks/${id}`],
  ["POST", "/api/artworks", { title: "Unauthorized test", category: "Pixel art" }],
  ["PATCH", `/api/artworks/${id}`, { status: "published" }],
  ["DELETE", `/api/artworks/${id}`],
  ["PATCH", "/api/artworks/order", { ids: [id] }],
  ["PATCH", "/api/profile", { name: "Unauthorized change" }],
  ["POST", "/api/uploads", { action: "prepare", purpose: "avatar", filename: "test.png", contentType: "image/png", sizeBytes: 100 }],
  ["POST", "/api/uploads", { action: "finalize", id }],
  ["DELETE", "/api/uploads", { id }],
  ["POST", "/api/storage/cleanup"],
  ["POST", "/api/auth/logout"],
];

for (const [method, path, body] of cases) {
  const response = await fetch(`${origin}${path}`, { method, headers: { Origin: origin, "Content-Type": "application/json", "X-Owner-Id": id, Cookie: `cms-owner=${id}; session=forged-session` }, ...(body ? { body: JSON.stringify(body) } : {}) });
  assert.ok(deniedStatuses.includes(response.status), `${method} ${path}: expected an authorization denial, got ${response.status}`);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  const data = await response.json();
  assert.equal(typeof data.error, "string");
  assert.equal("artworks" in data || "artwork" in data || "asset" in data, false);
  console.log(`PASS ${method} ${path}: ${response.status}`);
}

for (const path of ["/api/artworks", "/api/profile", "/api/uploads", "/api/auth/login"]) {
  const response = await fetch(`${origin}${path}`, { method: "POST", headers: { Origin: "https://unrelated.example", "Content-Type": "application/json" }, body: "{}" });
  // /api/profile has no POST handler; mutation safety is covered through PATCH below.
  if (path === "/api/profile") assert.equal(response.status, 405);
  else assert.equal(response.status, 403, `CSRF ${path}`);
  console.log(`PASS cross-origin ${path}: ${response.status}`);
}
const crossProfile = await fetch(`${origin}/api/profile`, { method: "PATCH", headers: { Origin: "https://unrelated.example", "Content-Type": "application/json" }, body: "{}" });
assert.equal(crossProfile.status, 403);

const protectedImage = await fetch(`${origin}/_next/image?url=${encodeURIComponent(`/api/media/${id}`)}&w=640&q=75`);
assert.equal(protectedImage.status, 400, "Protected media must not enter the public image optimizer cache");
console.log("PASS protected image optimizer exclusion");

if (allowUnconfigured) {
  const publicWorks = await fetch(`${origin}/api/artworks`);
  assert.equal(publicWorks.status, 503);
  const data = await publicWorks.json();
  assert.equal("artworks" in data, false);
  const publicProfile = await fetch(`${origin}/api/profile`);
  assert.equal(publicProfile.status, 503);
  const profile = await publicProfile.json();
  assert.equal("authId" in profile || "profile" in profile, false);
  console.log("PASS unconfigured APIs report setup required without private data");
}

console.log(`CMS HTTP authorization checks passed (${allowUnconfigured ? "unconfigured preview" : "configured without owner session"}).`);
