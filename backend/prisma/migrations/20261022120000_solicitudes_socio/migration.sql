-- CreateTable
CREATE TABLE "solicitudes_socio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "sexo" TEXT NOT NULL DEFAULT 'OTROS',
    "fecha_nac" TIMESTAMP(3),
    "mensaje" TEXT,
    "pin_hash" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "motivo_rechazo" TEXT,
    "socio_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta_at" TIMESTAMP(3),

    CONSTRAINT "solicitudes_socio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_socio_socio_id_key" ON "solicitudes_socio"("socio_id");

-- CreateIndex
CREATE INDEX "solicitudes_socio_estado_idx" ON "solicitudes_socio"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_socio_dni_idx" ON "solicitudes_socio"("dni");

-- AddForeignKey
ALTER TABLE "solicitudes_socio" ADD CONSTRAINT "solicitudes_socio_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
