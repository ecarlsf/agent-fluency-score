-- AlterTable
ALTER TABLE "User" ADD COLUMN "clerkId" TEXT;

-- Set a placeholder for existing rows
UPDATE "User" SET "clerkId" = 'legacy_' || "id" WHERE "clerkId" IS NULL;

-- Make column required
ALTER TABLE "User" ALTER COLUMN "clerkId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
