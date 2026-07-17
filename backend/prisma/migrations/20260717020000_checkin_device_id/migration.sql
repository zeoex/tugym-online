-- AlterTable
ALTER TABLE "asistencias" ADD COLUMN     "device_id" TEXT;

-- CreateIndex
CREATE INDEX "asistencias_device_id_idx" ON "asistencias"("device_id");
