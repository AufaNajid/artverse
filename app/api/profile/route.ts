import { connection } from "next/server";
import { Prisma } from "@prisma/client";
import { requireOwnerSession } from "@/lib/cms/auth";
import { hasCmsConfiguration } from "@/lib/cms/config";
import { prisma } from "@/lib/cms/db";
import { apiError, CmsError, privateJson } from "@/lib/cms/errors";
import { processStorageCleanup, queueRemovedAssets, assetUrl } from "@/lib/cms/media";
import { assertSameOrigin, readJson } from "@/lib/cms/security";
import { profileSchema } from "@/lib/cms/validation";

async function profileDto(profile: { name: string; bio: string; instagram: string; email: string | null; avatarPath: string | null; updatedAt: Date }) {
  return { name: profile.name, bio: profile.bio, instagram: profile.instagram, email: profile.email, avatarPath: profile.avatarPath, avatarUrl: await assetUrl(profile.avatarPath), updatedAt: profile.updatedAt };
}

export async function GET() {
  await connection();
  try {
    if (!hasCmsConfiguration()) throw new CmsError("The CMS has not been configured.", 503);
    const row = await prisma.portfolioProfile.findUnique({ where: { id: "singleton" } });
    if (!row) throw new CmsError("Run the portfolio seed to finish setup.", 503);
    return privateJson({ profile: await profileDto(row) });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const owner = await requireOwnerSession();
    const input = profileSchema.parse(await readJson(request));
    const row = await prisma.$transaction(async (tx) => {
      const old = await tx.portfolioProfile.findUnique({ where: { id: "singleton" } });
      if (!old || old.authId !== owner.id) throw new CmsError("Run the owner seed to finish setup.", 503);
      if (input.avatarPath && input.avatarPath !== old.avatarPath) {
        const asset = await tx.mediaAsset.findUnique({ where: { storagePath: input.avatarPath } });
        if (!asset?.validated || asset.ownerId !== owner.id || asset.purpose !== "avatar" || asset.artworkId) throw new CmsError("Select a validated profile upload.", 400);
      }
      const saved = await tx.portfolioProfile.update({ where: { id: "singleton" }, data: { ...input, email: input.email || (input.email === undefined ? undefined : null), instagram: input.instagram?.replace(/^@/, "") } });
      if (old.avatarPath && input.avatarPath !== undefined && old.avatarPath !== input.avatarPath) await queueRemovedAssets(tx, [old.avatarPath], owner.id);
      return saved;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await processStorageCleanup(owner.id).catch(() => undefined);
    return privateJson({ profile: await profileDto(row) });
  } catch (error) { return apiError(error); }
}
