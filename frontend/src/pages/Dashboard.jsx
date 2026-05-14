import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Paper, Table, TableBody, TableRow, TableCell, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, useTheme, useMediaQuery } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PeopleIcon from '@mui/icons-material/People';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import LightModeIcon from '@mui/icons-material/LightMode';
import NightlightIcon from '@mui/icons-material/Nightlight';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import SocioAvatar from '../components/SocioAvatar';

const TURNOS = [
  { label: 'Turno Mañana',  range: '6:00 – 12:00',  desde: 360,  hasta: 720,  color: '#f59e0b', bg: '#fffbeb', icon: <WbSunnyIcon />    },
  { label: 'Turno Siesta',  range: '12:00 – 16:00', desde: 720,  hasta: 960,  color: '#10b981', bg: '#f0fdf4', icon: <LightModeIcon />   },
  { label: 'Turno Tarde',   range: '16:00 – 20:00', desde: 960,  hasta: 1200, color: '#3b82f6', bg: '#eff6ff', icon: <NightlightIcon />  },
  { label: 'Turno Noche',   range: '20:00 – 23:30', desde: 1200, hasta: 1410, color: '#8b5cf6', bg: '#f5f3ff', icon: <BedtimeIcon />     },
];

function getTurnoActual() {
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return TURNOS.find(t => mins >= t.desde && mins < t.hasta) ?? null;
}

function whatsappUrl(telefono, nombre) {
  const num = telefono.replace(/\D/g, '');
  const intl = num.startsWith('54') ? num : `54${num}`;
  const msg = encodeURIComponent(
    `Hola ${nombre}! Te contactamos del gimnasio para avisarte que tu membresía se encuentra vencida. Por favor, acercate a renovarla cuando puedas. ¡Te esperamos!`
  );
  return `https://wa.me/${intl}?text=${msg}`;
}

function buildSeccion(rutina) {
  const labels = { HOMBRE: 'HOMBRES', MUJER: 'MUJERES', PRECALENTAMIENTO: 'PRECALENTAMIENTO' };
  return [
    `--- ${labels[rutina.tipo]}${rutina.nombre ? ': ' + rutina.nombre : ''} ---`,
    ...rutina.ejercicios.map((e, i) =>
      `${i + 1}.${e.nombre} | ${e.musculo} | ${e.series}x${e.reps} | ${e.descanso}`
    ),
  ].join('\n');
}

function buildQrCombinado(rutinas) {
  const fecha = rutinas[0]
    ? new Date(rutinas[0].fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
  return [`TuGymOnLine — Rutinas del dia (${fecha})`, '', rutinas.map(buildSeccion).join('\n\n')].join('\n');
}

const StatCard = ({ title, value, icon, color, sub }) => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" mb={0.5}>{title}</Typography>
          <Typography variant="h4" fontWeight={700}>{value}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        <Box sx={{ bgcolor: `${color}.light`, borderRadius: 2, p: 1.5, display: 'flex' }}>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats]               = useState(null);
  const [morosos, setMorosos]           = useState([]);
  const [rutinas, setRutinas]           = useState({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMorosos, setLoadingMorosos] = useState(true);
  const [qrData, setQrData]             = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .finally(() => setLoadingStats(false));

    api.get('/socios', { params: { estado: 'VENCIDO', limit: 100 } })
      .then(r => setMorosos(r.data.datos))
      .finally(() => setLoadingMorosos(false));

    api.get('/rutinas/hoy')
      .then(r => {
        const mapa = {};
        r.data.forEach(ru => { mapa[ru.tipo] = ru; });
        setRutinas(mapa);
      })
      .catch(() => {});
  }, []);

  if (loadingStats) return <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>;

  const turno      = getTurnoActual();
  const fechaLabel = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const abrirQrHombres = () => {
    const lista = [rutinas['PRECALENTAMIENTO'], rutinas['HOMBRE']].filter(Boolean);
    if (lista.length) setQrData({ titulo: 'QR Rutina Hombres', color: '#0ea5e9', rutinas: lista });
  };

  const abrirQrMujeres = () => {
    const lista = [rutinas['PRECALENTAMIENTO'], rutinas['MUJER']].filter(Boolean);
    if (lista.length) setQrData({ titulo: 'QR Rutina Mujeres', color: '#ec4899', rutinas: lista });
  };

  const tieneRutinas = rutinas['HOMBRE'] || rutinas['MUJER'];

  return (
    <Box>
      {/* Banner superior */}
      <Paper
        elevation={0}
        sx={{
          mb: 3, p: 2.5, borderRadius: 3,
          background: turno ? `linear-gradient(135deg, ${turno.bg} 0%, #ffffff 100%)` : 'linear-gradient(135deg, #f8fafc, #ffffff)',
          border: `1px solid ${turno ? turno.color + '33' : '#e2e8f0'}`,
          display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap',
        }}
      >
        <Box flex={1} minWidth={180}>
          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={1}>Hoy</Typography>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ textTransform: 'capitalize' }}>
            {fechaLabel}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5}>
          {turno ? (
            <>
              <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: turno.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: turno.color }}>
                {turno.icon}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Turno actual</Typography>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: turno.color, lineHeight: 1.2 }}>{turno.label}</Typography>
                <Typography variant="caption" color="text.secondary">{turno.range}</Typography>
              </Box>
            </>
          ) : (
            <Chip label="Gimnasio cerrado" variant="outlined" size="small" sx={{ color: '#94a3b8', borderColor: '#e2e8f0' }} />
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <PeopleIcon />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Socios activos</Typography>
            <Typography variant="h5" fontWeight={800} color="#10b981" lineHeight={1.1}>{stats.sociosActivos}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Stat cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Recaudación del Día" value={`$${Number(stats.recaudacionDia).toLocaleString('es-AR')}`} icon={<AttachMoneyIcon />} color="info" sub={`${stats.pagosDia} ${stats.pagosDia === 1 ? 'pago' : 'pagos'} hoy`} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Cuotas a Vencer" value={stats.proximosVencer} icon={<WarningAmberIcon />} color="warning" sub="vencen en los próximos 3 días" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Socios Morosos" value={stats.sociosVencidos} icon={<BlockIcon />} color="error" sub={`${stats.vencidosHoy} con pago vencido sin procesar`} />
        </Grid>
      </Grid>

      {/* QR Rutinas del día */}
      {tieneRutinas && (
        <Paper elevation={0} sx={{ mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <QrCode2Icon sx={{ color: 'text.secondary', fontSize: 18 }} />
            <Typography variant="subtitle1" fontWeight={700}>Rutinas del Día — QR</Typography>
            <Typography variant="caption" color="text.secondary">(escaneá desde el celular)</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper
                onClick={abrirQrHombres}
                elevation={0}
                sx={{
                  p: 2, cursor: 'pointer', borderRadius: 2,
                  border: '2px solid #bae6fd',
                  bgcolor: '#f0f9ff',
                  display: 'flex', alignItems: 'center', gap: 2,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: '#e0f2fe', borderColor: '#0ea5e9', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(14,165,233,0.15)' },
                }}
              >
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ManIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box flex={1}>
                  <Typography fontWeight={700} color="#0369a1">Rutina Hombres</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rutinas['HOMBRE']?.nombre || 'Precalentamiento + Rutina'}
                  </Typography>
                </Box>
                <QrCode2Icon sx={{ color: '#0ea5e9', fontSize: 28 }} />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                onClick={abrirQrMujeres}
                elevation={0}
                sx={{
                  p: 2, cursor: 'pointer', borderRadius: 2,
                  border: '2px solid #fbcfe8',
                  bgcolor: '#fdf2f8',
                  display: 'flex', alignItems: 'center', gap: 2,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: '#fce7f3', borderColor: '#ec4899', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(236,72,153,0.15)' },
                }}
              >
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WomanIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box flex={1}>
                  <Typography fontWeight={700} color="#9d174d">Rutina Mujeres</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rutinas['MUJER']?.nombre || 'Precalentamiento + Rutina'}
                  </Typography>
                </Box>
                <QrCode2Icon sx={{ color: '#ec4899', fontSize: 28 }} />
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Morosos */}
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <BlockIcon color="error" fontSize="small" />
          <Typography variant="h6" fontWeight={700}>Morosos — Avisar por WhatsApp</Typography>
          {!loadingMorosos && (
            <Chip label={morosos.length} color={morosos.length > 0 ? 'error' : 'success'} size="small" />
          )}
        </Box>

        <Paper>
          {loadingMorosos ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
          ) : morosos.length === 0 ? (
            <Box py={3} textAlign="center">
              <Typography color="text.secondary">No hay socios con membresía vencida</Typography>
            </Box>
          ) : isMobile ? (
            /* Mobile: tarjetas */
            <Box display="flex" flexDirection="column" gap={0}>
              {morosos.map((s, i) => (
                <Box
                  key={s.id}
                  sx={{ px: 2, py: 1.5, borderBottom: i < morosos.length - 1 ? '1px solid' : 'none', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}
                >
                  <SocioAvatar socio={s} size={38} />
                  <Box flex={1} minWidth={0}>
                    <Typography fontWeight={600} fontSize={13} noWrap>{s.apellido}, {s.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.telefono || 'Sin teléfono'}
                    </Typography>
                  </Box>
                  {s.telefono ? (
                    <Button variant="contained" size="small" startIcon={<WhatsAppIcon />}
                      component="a" href={whatsappUrl(s.telefono, s.nombre)} target="_blank" rel="noopener noreferrer"
                      sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' }, flexShrink: 0, minWidth: 0, px: 1.5 }}>
                      Avisar
                    </Button>
                  ) : (
                    <Button variant="outlined" size="small" disabled sx={{ flexShrink: 0, minWidth: 0, px: 1.5 }}>
                      <WhatsAppIcon fontSize="small" />
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            /* Desktop: tabla */
            <Table size="small">
              <TableBody>
                {morosos.map(s => (
                  <TableRow key={s.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell width={48}><SocioAvatar socio={s} size={36} /></TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>{s.apellido}, {s.nombre}</Typography>
                      {s.email && <Typography variant="caption" color="text.secondary">{s.email}</Typography>}
                    </TableCell>
                    <TableCell>
                      {s.telefono
                        ? <Typography variant="body2">{s.telefono}</Typography>
                        : <Typography variant="caption" color="text.disabled">Sin teléfono</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      {s.telefono ? (
                        <Button variant="contained" size="small" startIcon={<WhatsAppIcon />}
                          component="a" href={whatsappUrl(s.telefono, s.nombre)} target="_blank" rel="noopener noreferrer"
                          sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}>
                          Avisar
                        </Button>
                      ) : (
                        <Button variant="outlined" size="small" disabled startIcon={<WhatsAppIcon />}>Sin teléfono</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>

      {/* Dialog QR */}
      {qrData && (
        <Dialog open onClose={() => setQrData(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode2Icon sx={{ color: qrData.color }} /> {qrData.titulo}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={1}>
              <QRCodeSVG value={buildQrCombinado(qrData.rutinas)} size={300} level="L" includeMargin />
              <Typography variant="caption" color="text.secondary" textAlign="center">
                Incluye precalentamiento + rutina del día
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={() => setQrData(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
