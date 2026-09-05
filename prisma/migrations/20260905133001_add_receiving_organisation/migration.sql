-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "receivingOrganisationId" TEXT;

-- CreateIndex
CREATE INDEX "Case_receivingOrganisationId_idx" ON "Case"("receivingOrganisationId");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_receivingOrganisationId_fkey" FOREIGN KEY ("receivingOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
