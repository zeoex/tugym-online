-- AlterTable
ALTER TABLE "socios" ADD COLUMN     "rutina_asignada_id" INTEGER;

-- CreateTable
CREATE TABLE "ejercicios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "musculo" TEXT,
    "media_key" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutinas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'GENERAL',
    "socio_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rutinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutina_items" (
    "id" SERIAL NOT NULL,
    "rutina_id" INTEGER NOT NULL,
    "ejercicio_id" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "series" INTEGER NOT NULL DEFAULT 3,
    "reps" TEXT NOT NULL DEFAULT '10-12',
    "descanso" TEXT NOT NULL DEFAULT '60 seg',

    CONSTRAINT "rutina_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ejercicios_nombre_idx" ON "ejercicios"("nombre");

-- CreateIndex
CREATE INDEX "rutinas_socio_id_idx" ON "rutinas"("socio_id");

-- CreateIndex
CREATE INDEX "rutinas_tipo_idx" ON "rutinas"("tipo");

-- CreateIndex
CREATE INDEX "rutina_items_rutina_id_idx" ON "rutina_items"("rutina_id");

-- AddForeignKey
ALTER TABLE "socios" ADD CONSTRAINT "socios_rutina_asignada_id_fkey" FOREIGN KEY ("rutina_asignada_id") REFERENCES "rutinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutina_items" ADD CONSTRAINT "rutina_items_rutina_id_fkey" FOREIGN KEY ("rutina_id") REFERENCES "rutinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutina_items" ADD CONSTRAINT "rutina_items_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

