import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { portfolioPrisma?: PrismaClient };
export const prisma = globalForPrisma.portfolioPrisma ?? new PrismaClient({ log: [] });
if (process.env.NODE_ENV !== "production") globalForPrisma.portfolioPrisma = prisma;
