-- AlterTable
ALTER TABLE "configuracion" ADD COLUMN     "checkin_ventana_hs" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "dias_aviso_vencimiento" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "horarios" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "msg_moroso" TEXT,
ADD COLUMN     "msg_recuperacion" TEXT;
