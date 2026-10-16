import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { artworks } from "../data/artworks";
import { seedFailureMessage } from "./cms-seed-errors";

loadEnvConfig(process.cwd());
const ownerId = process.env.CMS_OWNER_ID?.trim().toLowerCase();
// Bootstrap uses the trusted setup connection, just like Prisma migrations.
// The running website continues to use its restricted DATABASE_URL.
const setupUrl = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
const prisma = new PrismaClient({ log: [], ...(setupUrl ? { datasources: { db: { url: setupUrl } } } : {}) });

async function seed() {
  if (!ownerId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(ownerId)) throw new Error("CMS_OWNER_ID_REQUIRED");
  if (!setupUrl) throw new Error("CMS_DATABASE_URL_REQUIRED");
  const owner = await prisma.portfolioProfile.findUnique({ where: { id: "singleton" } });
  if (owner && owner.authId !== ownerId) throw new Error("CMS_OWNER_MISMATCH");
  if (owner) { console.log("The portfolio is already initialized. Existing edits, drafts, and deletions were preserved."); return; }
  await prisma.$transaction(async (tx) => {
  await tx.portfolioProfile.create({ data: { id: "singleton", authId: ownerId!, name: "woxiwaldie", bio: "I make characters, colorful little worlds, and art with a little personality. Welcome to my corner of the internet.", instagram: "woxiwaldie" } });
  const seedIds = ["d3ce4048-731f-46b6-8421-e5830c3e3701", "d3ce4048-731f-46b6-8421-e5830c3e3702", "d3ce4048-731f-46b6-8421-e5830c3e3703", "d3ce4048-731f-46b6-8421-e5830c3e3704"];
  for (const [sortOrder, artwork] of artworks.entries()) {
    const exists = await tx.artwork.findFirst({ where: { OR: [{ id: seedIds[sortOrder] }, { slug: artwork.slug }] }, select: { id: true } });
    if (exists) continue; // Re-running seed never overwrites an owner's edits or publication state.
    const { coverImage, frameImage, ...metadata } = artwork;
    await tx.artwork.create({ data: { ...metadata, id: seedIds[sortOrder], coverPath: coverImage, framePath: frameImage, status: "published", publishedAt: new Date(), sortOrder } });
  }
  }, { maxWait: 10000, timeout: 60000 });
  console.log("Owner profile and the four original artworks are ready. Existing edits were preserved.");
}
seed().catch((error: unknown) => { console.error(seedFailureMessage(error)); process.exitCode = 1; }).finally(() => prisma.$disconnect());
