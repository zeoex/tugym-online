-- AlterTable
ALTER TABLE "socios" ADD COLUMN     "rutina_asignada" TEXT,
ADD COLUMN     "tipo_rutina" TEXT;

-- CreateTable
CREATE TABLE "anuncios" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_fin" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anuncios_pkey" PRIMARY KEY ("id")
);
