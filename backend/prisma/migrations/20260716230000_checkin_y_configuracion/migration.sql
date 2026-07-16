-- CreateTable
CREATE TABLE "configuracion" (
    "id" SERIAL NOT NULL,
    "nombre_gym" TEXT NOT NULL DEFAULT 'TuGymOnLine',
    "telefono" TEXT,
    "direccion" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "radio_checkin_m" INTEGER NOT NULL DEFAULT 150,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencias" (
    "id" SERIAL NOT NULL,
    "socio_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" TEXT NOT NULL DEFAULT 'GEO',
    "distancia_m" INTEGER,
    "cuota_vencida" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asistencias_socio_id_idx" ON "asistencias"("socio_id");

-- CreateIndex
CREATE INDEX "asistencias_fecha_idx" ON "asistencias"("fecha");

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

