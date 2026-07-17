import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Chip, Fade, Skeleton, GlobalStyles, Avatar,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import BadgeIcon from '@mui/icons-material/Badge';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HistoryIcon from '@mui/icons-material/History';
import { ACENTO, INK } from '../../theme';
import { portalApi, sesionSocio } from './portalApi';

const fmtFecha = (f) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtHora  = (f) => new Date(f).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

// "Hoy", "Ayer" o "Jueves 16/07"
function etiquetaDia(f) {
  const d = new Date(f);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dia = new Date(d); dia.setHours(0, 0, 0, 0);
  const diff = Math.round((hoy - dia) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  const txt = d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

export default function PortalCarnet() {
  const { info } = useOutletContext();
  const navigate = useNavigate();
  const [cuenta, setCuenta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sesionSocio.activa()) { setCargando(false); return; }
    portalApi.get('/cuenta')
      .then((r) => setCuenta(r.data))
      .catch((e) => setError(e.response?.data?.error || 'No pudimos cargar tu cuenta.'))
      .finally(() => setCargando(false));
  }, []);

  const cerrarSesion = () => {
    sesionSocio.clear();
    navigate('/portal');
  };

  if (!sesionSocio.activa()) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <BadgeIcon sx={{ color: ACENTO, fontSize: 40, mb: 1 }} />
        <Typography variant="h6" fontSize={17} mb={0.5}>Tu carnet digital</Typography>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          Ingresá con tu DNI y contraseña para ver tu credencial, tu cuota y tus asistencias.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/portal')}>Ingresar</Button>
      </Paper>
    );
  }

  if (cargando) {
    return (
      <Box>
        <Skeleton variant="rounded" height={210} sx={{ borderRadius: 5, mb: 2 }} />
        <Box display="flex" gap={1.5} mb={2}>
          <Skeleton variant="rounded" height={110} sx={{ flex: 1, borderRadius: 4 }} />
          <Skeleton variant="rounded" height={110} sx={{ flex: 1, borderRadius: 4 }} />
        </Box>
        <Skeleton variant="rounded" height={170} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  if (error || !cuenta) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#F87171' }} mb={2}>{error || 'No pudimos cargar tu cuenta.'}</Typography>
        <Button variant="outlined" onClick={cerrarSesion}>Ingresar de nuevo</Button>
      </Paper>
    );
  }

  const { socio, cuota, racha, visitas30, ultimas } = cuenta;
  const estadoCuota = !cuota.plan
    ? { texto: 'Sin plan activo', color: '#fff', bg: '#F87171' }
    : cuota.vigente
      ? { texto: 'Cuota al día', color: INK, bg: ACENTO }
      : { texto: 'Cuota vencida', color: INK, bg: '#FBBF24' };
  const iniciales = `${socio.nombre?.[0] || ''}${socio.apellido?.[0] || ''}`.toUpperCase();

  return (
    <Fade in>
      <Box>
        <GlobalStyles styles={{
          '@keyframes brillo-carnet': {
            '0%, 55%': { transform: 'translateX(-140%) skewX(-18deg)' },
            '85%, 100%': { transform: 'translateX(340%) skewX(-18deg)' },
          },
          '@keyframes sube': {
            from: { opacity: 0, transform: 'translateY(14px)' },
            to:   { opacity: 1, transform: 'translateY(0)' },
          },
        }} />

        {/* ══ CARNET ══ */}
        <Box sx={{
          p: '1.5px', borderRadius: 5, mb: 2,
          background: `linear-gradient(135deg, rgba(200,241,63,0.55), rgba(139,92,246,0.3) 45%, rgba(200,241,63,0.12))`,
          boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
          animation: 'sube 0.45s ease-out both',
        }}>
          <Box sx={{
            borderRadius: 4.7, p: 2.25, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(150deg, #1B2310 0%, #0B0F06 55%, #141B0A 100%)',
          }}>
            {/* marca de agua */}
            <FitnessCenterIcon sx={{
              position: 'absolute', right: -34, bottom: -38, fontSize: 180,
              color: 'rgba(200,241,63,0.05)', transform: 'rotate(-18deg)', pointerEvents: 'none',
            }} />
            {/* destello lima */}
            <Box sx={{
              position: 'absolute', top: -70, left: -50, width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,241,63,0.12) 0%, transparent 70%)', pointerEvents: 'none',
            }} />
            {/* brillo que recorre la tarjeta */}
            <Box sx={{
              position: 'absolute', top: 0, bottom: 0, width: '45%', pointerEvents: 'none',
              background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.05), transparent)',
              animation: 'brillo-carnet 6s ease-in-out infinite',
            }} />

            {/* fila: gym + estado */}
            <Box display="flex" alignItems="center" gap={0.75} mb={2}>
              <Box sx={{
                width: 22, height: 22, borderRadius: 1.25, bgcolor: ACENTO, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FitnessCenterIcon sx={{ color: INK, fontSize: 13 }} />
              </Box>
              <Typography fontSize={10.5} fontWeight={800} letterSpacing={2.2} noWrap
                sx={{ color: 'rgba(242,245,234,0.55)', textTransform: 'uppercase' }}>
                {info?.nombreGym || 'TuGymOnLine'}
              </Typography>
              <Chip label={estadoCuota.texto} size="small" sx={{
                ml: 'auto', bgcolor: estadoCuota.bg, color: estadoCuota.color,
                fontWeight: 900, fontSize: 10.5, height: 22, letterSpacing: 0.3, flexShrink: 0,
              }} />
            </Box>

            {/* socio */}
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Avatar
                src={socio.foto || undefined}
                sx={{
                  width: 52, height: 52, fontSize: 19, fontWeight: 800,
                  bgcolor: 'rgba(200,241,63,0.15)', color: ACENTO,
                  border: `2px solid ${ACENTO}`,
                }}
              >
                {iniciales}
              </Avatar>
              <Box minWidth={0}>
                <Typography variant="h5" fontSize={25} lineHeight={1.05} noWrap
                  sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {socio.nombre} {socio.apellido}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Socio desde {fmtFecha(socio.fechaAlta)}
                </Typography>
              </Box>
            </Box>

            {/* plan + QR: el bloque del QR está acotado para que NUNCA
                desborde la tarjeta, ni con letra grande ni en pantallas
                angostas (el texto envuelve en dos líneas) */}
            <Box display="flex" alignItems="flex-end" gap={1.5} flexWrap="wrap">
              <Box flex={1} minWidth={140}>
                {cuota.plan ? (
                  <>
                    <Chip label={cuota.plan} size="small" sx={{
                      bgcolor: 'rgba(200,241,63,0.14)', color: ACENTO, fontWeight: 800, fontSize: 11.5, mb: 0.75,
                    }} />
                    {cuota.venceEl && (
                      <Typography fontSize={12} color="text.secondary">
                        {cuota.vigente ? 'Vence' : 'Venció'} el <strong>{fmtFecha(cuota.venceEl)}</strong>
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography fontSize={12.5} color="text.secondary">
                    Sin plan activo — consultá en recepción
                  </Typography>
                )}
                {info?.ventanaPago && cuota.plan && (
                  <Typography fontSize={10.5} sx={{ color: 'rgba(242,245,234,0.4)', mt: 0.75, lineHeight: 1.5 }}>
                    Pagá del {info.ventanaPago.desde} al {info.ventanaPago.hasta} y evitás el recargo
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: 'center', flexShrink: 0, maxWidth: 104, ml: 'auto' }}>
                <Box sx={{
                  bgcolor: '#fff', p: 0.8, borderRadius: 2, lineHeight: 0,
                  display: 'inline-block',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
                }}>
                  <QRCodeSVG value={String(socio.dni || socio.id)} size={76} level="M" />
                </Box>
                <Typography sx={{
                  fontSize: 8.5, color: 'rgba(242,245,234,0.4)', mt: 0.5,
                  letterSpacing: 0.3, lineHeight: 1.35, maxWidth: 96, mx: 'auto',
                }}>
                  MOSTRÁ EN RECEPCIÓN
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ══ NÚMEROS ══ */}
        <Box display="flex" gap={1.5} mb={2} sx={{ animation: 'sube 0.45s 0.08s ease-out both' }}>
          {[
            { icono: <LocalFireDepartmentIcon sx={{ fontSize: 20 }} />, color: '#FBBF24', bg: 'rgba(251,191,36,0.13)', valor: racha, label: racha === 1 ? 'día de racha' : 'días de racha' },
            { icono: <EventAvailableIcon sx={{ fontSize: 20 }} />, color: ACENTO, bg: 'rgba(200,241,63,0.13)', valor: visitas30, label: 'visitas · 30 días' },
          ].map((s, i) => (
            <Paper key={i} sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
                bgcolor: s.bg, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.icono}
              </Box>
              <Box minWidth={0}>
                <Typography variant="h3" fontSize={30} lineHeight={1} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {s.valor}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{s.label}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* ══ TIMELINE DE VISITAS ══ */}
        {ultimas.length > 0 && (
          <Paper sx={{ p: 2, animation: 'sube 0.45s 0.14s ease-out both' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.75}>
              <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography fontWeight={700} fontSize={14}>Últimas visitas</Typography>
            </Box>
            {ultimas.map((a, i) => (
              <Box key={i} display="flex" gap={1.5}>
                {/* riel */}
                <Box display="flex" flexDirection="column" alignItems="center" sx={{ width: 12, flexShrink: 0 }}>
                  <Box sx={{
                    width: 10, height: 10, borderRadius: '50%', mt: 0.6,
                    bgcolor: i === 0 ? ACENTO : 'rgba(200,241,63,0.3)',
                    boxShadow: i === 0 ? '0 0 10px rgba(200,241,63,0.5)' : 'none',
                    flexShrink: 0,
                  }} />
                  {i < ultimas.length - 1 && (
                    <Box sx={{ width: 2, flex: 1, bgcolor: 'rgba(242,245,234,0.08)', my: 0.4 }} />
                  )}
                </Box>
                {/* contenido */}
                <Box flex={1} pb={i < ultimas.length - 1 ? 1.75 : 0} minWidth={0}
                  display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                  <Box minWidth={0}>
                    <Typography fontWeight={700} fontSize={13.5} lineHeight={1.3}>{etiquetaDia(a.fecha)}</Typography>
                    <Typography variant="caption" color="text.secondary">{fmtHora(a.fecha)} hs</Typography>
                  </Box>
                  <Chip
                    label={a.metodo === 'MANUAL' ? 'Recepción' : 'GPS'}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: 10, height: 20, fontWeight: 700, flexShrink: 0,
                      color: a.metodo === 'MANUAL' ? 'text.secondary' : ACENTO,
                      borderColor: a.metodo === 'MANUAL' ? 'rgba(242,245,234,0.2)' : 'rgba(200,241,63,0.4)',
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Paper>
        )}

        <Box textAlign="center">
          <Button onClick={cerrarSesion} size="small" startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
            sx={{ color: 'text.secondary', mt: 2.5 }}>
            Cerrar sesión
          </Button>
        </Box>
      </Box>
    </Fade>
  );
}
