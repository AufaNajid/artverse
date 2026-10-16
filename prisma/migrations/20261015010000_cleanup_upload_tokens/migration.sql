-- Delay object deletion until outstanding signed upload tokens have expired.
ALTER TABLE "StorageCleanup" ADD COLUMN "notBefore" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "StorageCleanup_ownerId_notBefore_idx" ON "StorageCleanup"("ownerId", "notBefore");
