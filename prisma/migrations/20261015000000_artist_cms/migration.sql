-- CreateTable
CREATE TABLE "PortfolioProfile" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "authId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "avatarPath" TEXT,
    "instagram" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artwork" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "coverPath" TEXT,
    "framePath" TEXT,
    "alt" TEXT NOT NULL DEFAULT '',
    "width" INTEGER,
    "height" INTEGER,
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "year" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT '#b6f2ed',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brief" TEXT NOT NULL DEFAULT '',
    "approach" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkImage" (
    "id" UUID NOT NULL,
    "artworkId" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArtworkImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "artworkId" UUID,
    "storagePath" TEXT NOT NULL,
    "framePath" TEXT,
    "mime" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageCleanup" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "storagePaths" TEXT[],
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptedAt" TIMESTAMP(3),

    CONSTRAINT "StorageCleanup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioProfile_authId_key" ON "PortfolioProfile"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "Artwork_slug_key" ON "Artwork"("slug");

-- CreateIndex
CREATE INDEX "Artwork_status_sortOrder_idx" ON "Artwork"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "ArtworkImage_artworkId_sortOrder_idx" ON "ArtworkImage"("artworkId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storagePath_key" ON "MediaAsset"("storagePath");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_framePath_key" ON "MediaAsset"("framePath");

-- CreateIndex
CREATE INDEX "MediaAsset_artworkId_idx" ON "MediaAsset"("artworkId");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerId_idx" ON "MediaAsset"("ownerId");

-- AddForeignKey
ALTER TABLE "ArtworkImage" ADD CONSTRAINT "ArtworkImage_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Application invariants also apply to privileged database writes.
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_status_check" CHECK (status IN ('draft', 'published'));
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_published_fields_check" CHECK (status <> 'published' OR (length(trim(title)) > 0 AND "coverPath" IS NOT NULL AND length(trim(alt)) > 0 AND "publishedAt" IS NOT NULL));
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_validated_dimensions_check" CHECK (NOT validated OR (width > 0 AND height > 0 AND "framePath" IS NOT NULL AND "sizeBytes" > 0 AND "sizeBytes" <= 10485760));

-- Protect CMS metadata immediately, before the separate Storage setup is applied.
ALTER TABLE "PortfolioProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Artwork" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ArtworkImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StorageCleanup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CmsRateLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "PortfolioProfile", "Artwork", "ArtworkImage", "MediaAsset", "StorageCleanup", "CmsRateLimit" FROM anon, authenticated;

CREATE INDEX "Artwork_coverPath_idx" ON "Artwork"("coverPath");
CREATE INDEX "Artwork_framePath_idx" ON "Artwork"("framePath");
CREATE INDEX "ArtworkImage_storagePath_idx" ON "ArtworkImage"("storagePath");
