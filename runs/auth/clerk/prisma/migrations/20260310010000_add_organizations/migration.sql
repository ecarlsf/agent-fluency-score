-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Create a default organization for existing users
INSERT INTO "Organization" ("name", "createdAt", "updatedAt")
VALUES ('Default Organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable User: add organizationId
ALTER TABLE "User" ADD COLUMN "organizationId" INTEGER;

-- Set existing users to the default organization
UPDATE "User" SET "organizationId" = (SELECT "id" FROM "Organization" LIMIT 1);

-- Make column required
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable Post: add organizationId
ALTER TABLE "Post" ADD COLUMN "organizationId" INTEGER;

-- Set existing posts to their author's organization
UPDATE "Post" SET "organizationId" = (
    SELECT "organizationId" FROM "User" WHERE "User"."id" = "Post"."authorId"
);

-- Make column required
ALTER TABLE "Post" ALTER COLUMN "organizationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
