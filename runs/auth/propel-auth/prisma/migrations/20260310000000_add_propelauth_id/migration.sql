-- AlterTable
ALTER TABLE "User" ADD COLUMN     "propelAuthId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_propelAuthId_key" ON "User"("propelAuthId");
