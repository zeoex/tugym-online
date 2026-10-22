-- AlterTable
ALTER TABLE "ejercicios" ADD COLUMN     "imagenes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "videos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "descripcion" TEXT;
