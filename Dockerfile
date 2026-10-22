# EvoGym (TuGymOnLine) — imagen para CapRover (app `evogym`)
# Express + Prisma + Postgres. Una sola app: en producción el backend sirve el
# frontend ya compilado (backend/src/server.js → ../../frontend/dist).
FROM node:20-slim

# openssl lo exige Prisma; ca-certificates para las llamadas salientes.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/*

# Hora argentina fija en la imagen: sin tzdata la variable TZ se ignora y el contenedor
# queda en UTC (rachas, check-ins, cron de vencimientos y rutina del día cortarían 3 h antes).
ARG TZ=America/Argentina/Buenos_Aires
ENV TZ=$TZ
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

COPY . .

# El script "build" de la raíz instala backend + frontend, corre prisma generate y
# compila el frontend con vite. Placeholder de DATABASE_URL: `prisma generate` exige
# una URL con formato válido pero no se conecta; la real llega por env var en runtime.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build && npm cache clean --force

ENV NODE_ENV=production
ENV PORT=4000

# Los uploads van a un Persistent Directory: fuera de ahí se borran en cada deploy.
# El código ya lo respeta (backend/src/config/uploads.js lee UPLOADS_DIR).
ENV UPLOADS_DIR=/data/uploads

# app.listen(PORT) sin host → bindea a 0.0.0.0, que es lo que necesita nginx.
EXPOSE 4000

# El "start" de la raíz corre `prisma migrate deploy` antes de arrancar. Es seguro
# como paso de arranque porque las migraciones están versionadas en el repo y
# migrate deploy solo aplica las pendientes — nunca borra datos, a diferencia de
# `db push`, que sí puede tirar columnas.
# En el panel de CapRover: Container HTTP Port = 4000
CMD ["npm", "start"]
