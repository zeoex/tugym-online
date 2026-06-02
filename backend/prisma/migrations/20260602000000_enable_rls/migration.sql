-- Enable Row Level Security on all public tables
-- The backend connects via the Supabase service_role which bypasses RLS,
-- so this does NOT affect backend functionality. It blocks direct access
-- to these tables via PostgREST for the anon/authenticated roles.

-- Prisma's internal migrations table
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Application tables
ALTER TABLE "usuarios"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "socios"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planes"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pagos"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rutinas_dia"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "caja_dia"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "anuncios"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notificaciones" ENABLE ROW LEVEL SECURITY;
