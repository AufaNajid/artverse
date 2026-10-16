import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireOwnerSession } from "@/lib/cms/auth";
import { prisma } from "@/lib/cms/db";
import { apiError, CmsError, privateJson } from "@/lib/cms/errors";
import { assertSameOrigin, readJson } from "@/lib/cms/security";
import { uuidSchema } from "@/lib/cms/validation";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    await requireOwnerSession();
    const { ids } = z.object({ ids: z.array(uuidSchema).max(1000) }).strict().parse(await readJson(request));
    if (new Set(ids).size !== ids.length) throw new CmsError("Each artwork must appear exactly once.", 400);
    await prisma.$transaction(async (tx) => {
      const count = await tx.artwork.count();
      if (count !== ids.length || await tx.artwork.count({ where: { id: { in: ids } } }) !== count) throw new CmsError("The artwork list changed. Refresh it before reordering.", 409);
      for (const [sortOrder, id] of ids.entries()) await tx.artwork.update({ where: { id }, data: { sortOrder } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return privateJson({ success: true });
  } catch (error) { return apiError(error); }
}
