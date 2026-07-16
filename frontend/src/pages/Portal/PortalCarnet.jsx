import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, CircularProgress, Chip, Fade,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import BadgeIcon from '@mui/icons-material/Badge';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { LIMA, INK } from '../../theme';
import { portalApi, dniGuardado } from './portalApi';

const fmtFecha = (f) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtHora  = (f) => new Date(f).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

export default function PortalCarnet() {
  const [dni, setDni] = useState(dniGuardado.get());
  const [dniInput, setDniInput] = useState('');
  const [cuenta, setCuenta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargarCuenta = (valor) => {
    setCargando(true);
    setError('');
    portalApi.get(`/cuenta/${encodeURIComponent(valor)}`)
      .then((r) => setCuenta(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'No pudimos cargar tu cuenta.');
        setCuenta(null);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (dni) cargarCuenta(dni);
  }, [dni]);

  const confirmarDni = () => {
    const valor = dniInput.trim();
    if (!valor) return;
    dniGuardado.set(valor);
    setDni(valor);
  };

  const cambiarDni = () => {
    dniGuardado.clear();
    setDni('');
    setDniInput('');
    setCuenta(null);
  };

  if (!dni) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <BadgeIcon sx={{ color: LIMA, fontSize: 40, mb: 1 }} />
        <Typography variant="h6" fontSize={17} mb={0.5}>Tu carnet digital</Typography>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          Ingresá tu DNI para ver tu credencial, tu cuota y tus asistencias.
        </Typography>
        <Box display="flex" gap={1} justifyContent="center">
          <TextField
            placeholder="Tu DNI"
            value={dniInput}
            onChange={(e) => setDniInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmarDni()}
            inputProps={{ inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 700, letterSpacing: 1 } }}
            sx={{ maxWidth: 190 }}
          />
          <Button variant="contained" onClick={confirmarDni} disabled={!dniInput.trim()}>Ver</Button>
        </Box>
        {error && <Typography variant="body2" sx={{ color: '#F87171', mt: 1.5 }}>{error}</Typography>}
      </Paper>
    );
  }

  if (cargando) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  if (error || !cuenta) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#F87171' }} mb={2}>{error || 'No pudimos cargar tu cuenta.'}</Typography>
        <Button variant="outlined" onClick={cambiarDni}>Probar con otro DNI</Button>
      </Paper>
    );
  }

  const { socio, cuota, racha, visitas30, ultimas } = cuenta;
  const estadoCuota = !cuota.plan
    ? { texto: 'Sin plan activo', color: '#F87171', bg: 'rgba(248,113,113,0.12)' }
    : cuota.vigente
      ? { texto: 'Cuota al día', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' }
      : { texto: 'Cuota vencida', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' };

  return (
    <Fade in>
      <Box>
        {/* ── Carnet ── */}
        <Box sx={{
          p: 2.5, mb: 2, borderRadius: 5,
          background: `linear-gradient(140deg, #1B2113 0%, #10130A 55%, #171C0E 100%)`,
          border: '1px solid rgba(200,241,63,0.25)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 0 60px rgba(200,241,63,0.04)',
          position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{
            position: 'absolute', top: -50, right: -50, width: 170, height: 170, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,241,63,0.14) 0%, transparent 70%)',
          }} />

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Box sx={{
              width: 26, height: 26, borderRadius: 1.5, bgcolor: LIMA,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FitnessCenterIcon sx={{ color: INK, fontSize: 15 }} />
            </Box>
            <Typography fontSize={11} fontWeight={700} letterSpacing={2} sx={{ color: 'rgba(242,245,234,0.5)' }}>
              CARNET DE SOCIO
            </Typography>
            <Chip label={estadoCuota.texto} size="small" sx={{
              ml: 'auto', bgcolor: estadoCuota.bg, color: estadoCuota.color, fontWeight: 800, fontSize: 11,
            }} />
          </Box>

          <Box display="flex" gap={2} alignItems="center">
            <Box flexGrow={1} minWidth={0}>
              <Typography variant="h5" fontSize={22} lineHeight={1.15} noWrap>
                {socio.nombre} {socio.apellido}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontSize={12} mb={1.25}>
                Socio desde {fmtFecha(socio.fechaAlta)}
              </Typography>
              {cuota.plan && (
                <Typography fontSize={13} fontWeight={600}>
                  {cuota.plan}
                  {cuota.venceEl && (
                    <Typography component="span" fontSize={12} color="text.secondary">
                      {' '}· {cuota.vigente ? 'vence' : 'venció'} el {fmtFecha(cuota.venceEl)}
                    </Typography>
                  )}
                </Typography>
              )}
            </Box>
            <Box sx={{ bgcolor: '#fff', p: 1, borderRadius: 2.5, flexShrink: 0, lineHeight: 0 }}>
              <QRCodeSVG value={String(dni)} size={86} level="M" />
            </Box>
          </Box>
        </Box>

        {/* ── Números ── */}
        <Box display="flex" gap={1.5} mb={2}>
          {[
            { icono: <LocalFireDepartmentIcon sx={{ color: '#FBBF24', fontSize: 22 }} />, valor: racha, label: racha === 1 ? 'día de racha' : 'días de racha' },
            { icono: <EventAvailableIcon sx={{ color: LIMA, fontSize: 22 }} />, valor: visitas30, label: 'visitas (30 días)' },
          ].map((s, i) => (
            <Paper key={i} sx={{ flex: 1, p: 2, textAlign: 'center' }}>
              {s.icono}
              <Typography variant="h4" fontSize={26} lineHeight={1.1}>{s.valor}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Box>

        {/* ── Últimas asistencias ── */}
        {ultimas.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={700} fontSize={14} mb={1.5}>Últimas visitas</Typography>
            {ultimas.map((a, i) => (
              <Box key={i} display="flex" justifyContent="space-between" py={0.75}
                sx={{ borderBottom: i < ultimas.length - 1 ? '1px solid rgba(242,245,234,0.06)' : 'none' }}>
                <Typography fontSize={13.5}>{fmtFecha(a.fecha)}</Typography>
                <Typography fontSize={13.5} color="text.secondary">
                  {fmtHora(a.fecha)} hs {a.metodo === 'MANUAL' ? '· recepción' : ''}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}

        <Button onClick={cambiarDni} size="small" sx={{ color: 'text.secondary', mt: 2 }}>
          Usar otro DNI
        </Button>
      </Box>
    </Fade>
  );
}
