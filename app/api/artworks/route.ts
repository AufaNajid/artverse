import { connection } from "next/server";
import { requireOwnerSession } from "@/lib/cms/auth";
import { hasCmsConfiguration } from "@/lib/cms/config";
import { prisma } from "@/lib/cms/db";
import { artworkInclude, createArtwork, serializeArtwork } from "@/lib/cms/artworks";
import { apiError, CmsError, privateJson } from "@/lib/cms/errors";
import { processStorageCleanup } from "@/lib/cms/media";
import { assertSameOrigin, readJson } from "@/lib/cms/security";

export async function GET(request: Request) {
  await connection();
  try {
    if (!hasCmsConfiguration()) throw new CmsError("The CMS has not been configured.", 503);
    const ownerScope = new URL(request.url).searchParams.get("scope") === "owner";
    if (ownerScope) await requireOwnerSession();
    const rows = await prisma.artwork.findMany({ where: ownerScope ? {} : { status: "published" }, include: artworkInclude, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return privateJson({ artworks: await Promise.all(rows.map(serializeArtwork)) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const owner = await requireOwnerSession();
    const row = await createArtwork(await readJson(request), owner.id);
    await processStorageCleanup(owner.id).catch(() => undefined);
    return privateJson({ artwork: await serializeArtwork(row) }, 201);
  } catch (error) { return apiError(error); }
}
