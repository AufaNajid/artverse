import test from "node:test";
import assert from "node:assert/strict";
import { assertSameOrigin, readJson } from "../../lib/cms/security";

function status(error: unknown, expected: number) {
  return typeof error === "object" && error !== null && "status" in error && error.status === expected;
}

test("cookie-authenticated writes reject missing, foreign, or cross-site origins", () => {
  const endpoint = "https://portfolio.example/api/artworks";
  assert.throws(() => assertSameOrigin(new Request(endpoint)), error => status(error, 403));
  assert.throws(() => assertSameOrigin(new Request(endpoint, { headers: { origin: "https://unrelated.example" } })), error => status(error, 403));
  assert.throws(() => assertSameOrigin(new Request(endpoint, { headers: { origin: "https://portfolio.example", "sec-fetch-site": "cross-site" } })), error => status(error, 403));
  assert.doesNotThrow(() => assertSameOrigin(new Request(endpoint, { headers: { origin: "https://portfolio.example", "sec-fetch-site": "same-origin" } })));
});

test("same-origin writes use the incoming host when Next normalizes localhost", () => {
  const endpoint = "http://localhost:3000/api/artworks";
  assert.doesNotThrow(() => assertSameOrigin(new Request(endpoint, { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } })));
  assert.throws(() => assertSameOrigin(new Request(endpoint, { headers: { host: "127.0.0.1:3000", origin: "https://unrelated.example" } })), error => status(error, 403));
});

test("JSON input rejects unsupported types and malformed content", async () => {
  const endpoint = "https://portfolio.example/api/artworks";
  await assert.rejects(readJson(new Request(endpoint, { method: "POST", body: "x", headers: { "Content-Type": "text/plain" } })), error => status(error, 415));
  await assert.rejects(readJson(new Request(endpoint, { method: "POST", body: "{", headers: { "Content-Type": "application/json" } })), error => status(error, 400));
  assert.deepEqual(await readJson(new Request(endpoint, { method: "POST", body: '{"title":"A new world"}', headers: { "Content-Type": "application/json" } })), { title: "A new world" });
});

test("chunked JSON body is bounded even without a Content-Length header", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(70 * 1024)); controller.enqueue(new Uint8Array(70 * 1024)); },
    cancel() { cancelled = true; },
  });
  const request = new Request("https://portfolio.example/api/artworks", { method: "POST", headers: { "Content-Type": "application/json" }, body: stream, duplex: "half" } as RequestInit);
  await assert.rejects(readJson(request), error => status(error, 413));
  assert.equal(cancelled, true);
});
