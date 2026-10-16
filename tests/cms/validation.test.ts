import test from "node:test";
import assert from "node:assert/strict";
import { assertReferenceCount, createArtworkSchema, isOwnedStoragePath, patchArtworkSchema, profileSchema, publicationSchema, sniffImageMime, uploadPrepareSchema } from "../../lib/cms/validation";

const owner = "17f35d47-025b-4b42-b51c-a85ecc4d09d2";
const asset = "fa7595db-0b96-4d3f-8a7b-90104ff9ec4e";

test("draft creation requires a real title and a supported category", () => {
  assert.equal(createArtworkSchema.safeParse({ title: "   ", category: "Pixel art" }).success, false);
  assert.equal(createArtworkSchema.safeParse({ title: "New work", category: "Unapproved category" }).success, false);
  assert.equal(createArtworkSchema.safeParse({ title: "New work", category: "Characters" }).success, true);
});

test("owner metadata cannot inject protected fields or unsafe presentation values", () => {
  assert.equal(patchArtworkSchema.safeParse({ id: asset, ownerId: owner }).success, false);
  assert.equal(patchArtworkSchema.safeParse({ slug: "../../dashboard" }).success, false);
  assert.equal(patchArtworkSchema.safeParse({ color: "url(javascript:alert(1))" }).success, false);
  assert.equal(profileSchema.safeParse({ instagram: "javascript:alert(1)" }).success, false);
  assert.equal(profileSchema.safeParse({ authId: owner }).success, false);
});

test("publication rejects a missing cover or blank accessibility description", () => {
  const artwork = { title: "A new world", category: "Pixel art", coverPath: `${owner}/${asset}/original.png`, alt: "A mint character in a floating pixel world." };
  assert.equal(publicationSchema.safeParse(artwork).success, true);
  assert.equal(publicationSchema.safeParse({ ...artwork, coverPath: null }).success, false);
  assert.equal(publicationSchema.safeParse({ ...artwork, alt: "  " }).success, false);
  assert.equal(publicationSchema.safeParse({ ...artwork, title: "" }).success, false);
});

test("upload preparation enforces supported MIME, 10 MB, and artwork ownership context", () => {
  const input = { action: "prepare", artworkId: asset, purpose: "gallery", filename: "work.png", contentType: "image/png", sizeBytes: 10 * 1024 * 1024 };
  assert.equal(uploadPrepareSchema.safeParse(input).success, true);
  assert.equal(uploadPrepareSchema.safeParse({ ...input, sizeBytes: input.sizeBytes + 1 }).success, false);
  assert.equal(uploadPrepareSchema.safeParse({ ...input, contentType: "image/svg+xml" }).success, false);
  assert.equal(uploadPrepareSchema.safeParse({ ...input, artworkId: undefined }).success, false);
  assert.equal(uploadPrepareSchema.safeParse({ ...input, artworkId: undefined, purpose: "avatar" }).success, true);
});

test("file signatures reject SVG and renamed non-images", () => {
  assert.equal(sniffImageMime(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  assert.equal(sniffImageMime(new TextEncoder().encode("pretend.png")), null);
  assert.equal(sniffImageMime(new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])), "image/png");
  assert.equal(sniffImageMime(new Uint8Array([0xff,0xd8,0xff,0xe0])), "image/jpeg");
  assert.equal(sniffImageMime(new TextEncoder().encode("RIFFxxxxWEBP")), "image/webp");
});

test("storage cleanup paths cannot escape owner or expected generated filenames", () => {
  assert.equal(isOwnedStoragePath(`${owner}/${asset}/original.png`, owner), true);
  assert.equal(isOwnedStoragePath(`${owner}/${asset}/frame.webp`, owner), true);
  for (const path of [`${asset}/${asset}/original.png`, `${owner}/../original.png`, `${owner}/${asset}/../../private`, `/artworks/art1.png`, "https://example.com/art.png", `${owner}/${asset}/script.svg`]) {
    assert.equal(isOwnedStoragePath(path, owner), false, path);
  }
});

test("cover and gallery enforce one shared fifteen-image limit without duplicates", () => {
  const images = Array.from({ length: 14 }, (_, i) => `image-${i}`);
  assert.equal(assertReferenceCount("cover", images), true);
  assert.equal(assertReferenceCount("cover", [...images, "image-15"]), false);
  assert.equal(assertReferenceCount("cover", ["cover"]), false);
  assert.equal(assertReferenceCount(null, ["same", "same"]), false);
});
