import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createOwnerClient, createPublicStorageClient, getOwnerSession } from "@/lib/cms/auth";
import { cmsConfiguration, hasCmsConfiguration } from "@/lib/cms/config";
import { prisma } from "@/lib/cms/db";
import { apiError, CmsError } from "@/lib/cms/errors";
import { uuidSchema } from "@/lib/cms/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    if (!hasCmsConfiguration()) throw new CmsError("Media is unavailable until setup is complete.", 503);
    const id = uuidSchema.parse((await params).id);
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset?.validated) throw new CmsError("Image not found.", 404);
    const isPublic = !!await prisma.artwork.findFirst({ where: { status: "published", OR: [{ coverPath: asset.storagePath }, { images: { some: { storagePath: asset.storagePath } } }] }, select: { id: true } }) || !!await prisma.portfolioProfile.findFirst({ where: { avatarPath: asset.storagePath }, select: { id: true } });
    let client = createPublicStorageClient();
    if (!isPublic) {
      const owner = await getOwnerSession();
      if (!owner || owner.id !== asset.ownerId) throw new CmsError("Image not found.", 404);
      client = await createOwnerClient();
    }
    const path = new URL(request.url).searchParams.get("variant") === "frame" ? asset.framePath ?? asset.storagePath : asset.storagePath;
    const { data, error } = await client.storage.from(cmsConfiguration().bucket).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) throw new CmsError("The image is temporarily unavailable.", 503);
    const response = NextResponse.redirect(data.signedUrl, 302);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  } catch (error) { return apiError(error); }
}
