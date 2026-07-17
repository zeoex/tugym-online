import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, TextField, CircularProgress,
  Chip, Fade, GlobalStyles, Skeleton, InputAdornment, IconButton,
} from '@mui/material';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import GroupsIcon from '@mui/icons-material/Groups';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InstagramIcon from '@mui/icons-material/Instagram';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BadgeIcon from '@mui/icons-material/Badge';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ACENTO, VIOLETA, INK } from '../../theme';
import { portalApi, dniGuardado, deviceId, sesionSocio } from './portalApi';
import AnunciosDestacados from './AnunciosDestacados';

function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Tu teléfono no permite acceder a la ubicación.'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(new Error(
        err.code === 1
          ? 'Permití el acceso a tu ubicación para hacer el check-in.'
          : 'No pudimos obtener tu ubicación. Activá el GPS y probá de nuevo.'
      )),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}

/* Explosión de partículas al confirmar el check-in */
function Festejo() {
  const particulas = Array.from({ length: 14 }, (_, i) => {
    const angulo = (i / 14) * Math.PI * 2;
    return {
      x: Math.cos(angulo) * (70 + (i % 3) * 26),
      y: Math.sin(angulo) * (58 + ((i + 1) % 3) * 24),
      color: [ACENTO, VIOLETA, '#F2F5EA'][i % 3],
      delay: (i % 4) * 0.05,
    };
  });
  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {particulas.map((p, i) => (
        <Box key={i} sx={{
          position: 'absolute', top: '42%', left: '50%',
          width: 7, height: 7, borderRadius: '50%',
          bgcolor: p.color,
          animation: `vuela 0.9s ${p.delay}s cubic-bezier(0.2, 0.8, 0.4, 1) forwards`,
          '--fx': `${p.x}px`, '--fy': `${p.y}px`,
          opacity: 0,
        }} />
      ))}
    </Box>
  );
}

/* Ingreso del socio: DNI + contraseña. La primera vez crea la suya. */
function LoginSocio({ onIngreso }) {
  const [dni, setDni] = useState(dniGuardado.get());
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [paso, setPaso] = useState('login'); // login | activar
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const entrar = async () => {
    if (!dni.trim()) return;
    setError('');
    setCargando(true);
    try {
      if (paso === 'activar') {
        if (password.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return; }
        if (password !== confirmar) { setError('Las contraseñas no coinciden'); return; }
        const { data } = await portalApi.post('/activar', { dni: dni.trim(), password });
        dniGuardado.set(dni);
        sesionSocio.set(data.token, data.socio.nombre);
        onIngreso();
      } else {
        const { data } = await portalApi.post('/login', { dni: dni.trim(), password });
        if (data.necesitaActivacion) {
          setPaso('activar');
          setPassword('');
          setError('');
          return;
        }
        dniGuardado.set(dni);
        sesionSocio.set(data.token, data.socio.nombre);
        onIngreso();
      }
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo ingresar');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 2, textAlign: 'center', animation: 'sube 0.45s 0.06s ease-out both' }}>
      <Box sx={{
        width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 1.5,
        bgcolor: 'rgba(200,241,63,0.12)', border: `2px solid ${ACENTO}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BadgeIcon sx={{ color: ACENTO, fontSize: 28 }} />
      </Box>

      {paso === 'activar' ? (
        <>
          <Typography variant="h6" fontSize={17} mb={0.5}>¡Primera vez! Creá tu contraseña</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Tu DNI está registrado en el gym. Elegí una contraseña para tu cuenta.
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h6" fontSize={17} mb={0.5}>Ingresá a tu cuenta</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Check-in, tu rutina con animaciones y tu carnet digital.
          </Typography>
        </>
      )}

      <Box display="flex" flexDirection="column" gap={1.5} maxWidth={280} mx="auto">
        <TextField
          placeholder="Tu DNI"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          disabled={paso === 'activar'}
          inputProps={{ inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 700, letterSpacing: 1 } }}
        />
        <TextField
          placeholder={paso === 'activar' ? 'Nueva contraseña' : 'Contraseña'}
          type={verPass ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && paso === 'login' && entrar()}
          inputProps={{ style: { textAlign: 'center' } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setVerPass((v) => !v)} edge="end">
                  {verPass ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {paso === 'activar' && (
          <TextField
            placeholder="Repetí la contraseña"
            type={verPass ? 'text' : 'password'}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
            inputProps={{ style: { textAlign: 'center' } }}
          />
        )}
        <Button variant="contained" size="large" onClick={entrar} disabled={cargando || !dni.trim() || !password}>
          {cargando ? <CircularProgress size={22} color="inherit" />
            : paso === 'activar' ? 'Crear y entrar' : 'Ingresar'}
        </Button>
        {error && <Typography variant="body2" sx={{ color: '#F87171' }}>{error}</Typography>}
        {paso === 'activar' && (
          <Button size="small" onClick={() => { setPaso('login'); setError(''); }} sx={{ color: 'text.secondary' }}>
            Volver
          </Button>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" mt={2}>
        ¿Olvidaste tu contraseña? Pedí en recepción que te la reseteen.
      </Typography>
    </Paper>
  );
}

export default function PortalHome() {
  const { info, refrescarInfo } = useOutletContext();
  const navigate = useNavigate();

  const [sesion, setSesion] = useState(sesionSocio.activa());
  const [nombre, setNombre] = useState(sesionSocio.nombre());
  const [miDia, setMiDia] = useState(null); // { checkinHoy, racha }

  // idle | ubicando | enviando | exito | error
  const [fase, setFase] = useState('idle');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sesion) return;
    portalApi.get('/cuenta')
      .then((r) => {
        setNombre(r.data.socio.nombre);
        setMiDia({ checkinHoy: r.data.checkinHoy, racha: r.data.racha });
      })
      .catch(() => setSesion(sesionSocio.activa()));
  }, [sesion]);

  const hacerCheckin = async () => {
    setError('');
    setFase('ubicando');
    try {
      const coords = await obtenerUbicacion();
      setFase('enviando');
      const { data } = await portalApi.post('/checkin', {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        deviceId: deviceId(),
      });
      setResultado(data);
      setFase('exito');
      setMiDia({ checkinHoy: true, racha: data.racha });
      refrescarInfo();
    } catch (e) {
      if (!sesionSocio.activa()) { setSesion(false); setFase('idle'); return; }
      setError(e.message && !e.response ? e.message : (e.response?.data?.error || 'No se pudo registrar el check-in.'));
      setFase('error');
    }
  };

  const ocupado = fase === 'ubicando' || fase === 'enviando';

  return (
    <Box>
      <GlobalStyles styles={{
        '@keyframes vuela': {
          '0%':   { transform: 'translate(0,0) scale(1)', opacity: 1 },
          '100%': { transform: 'translate(var(--fx), var(--fy)) scale(0.4)', opacity: 0 },
        },
        '@keyframes latido': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(200,241,63,0.35)' },
          '50%':     { boxShadow: '0 0 0 16px rgba(200,241,63,0)' },
        },
        '@keyframes sube': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      }} />

      {/* Saludo + gente entrenando */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}
        sx={{ animation: 'sube 0.45s ease-out both' }}>
        <Box>
          <Typography variant="h4" fontSize={30}>
            {sesion && nombre ? `Hola, ${nombre} 👋` : 'Hola 👋'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </Box>
        {info?.entrenandoAhora > 0 && (
          <Chip
            icon={<GroupsIcon sx={{ fontSize: 16 }} />}
            label={`${info.entrenandoAhora} entrenando`}
            size="small"
            sx={{ bgcolor: 'rgba(200,241,63,0.12)', color: ACENTO, fontWeight: 700, '& .MuiChip-icon': { color: ACENTO } }}
          />
        )}
      </Box>

      {/* Anuncios del gym: siempre visibles, con o sin sesión */}
      <AnunciosDestacados />

      {/* ── Check-in / Login ── */}
      {!sesion ? (
        <LoginSocio onIngreso={() => { setSesion(true); setNombre(sesionSocio.nombre()); }} />
      ) : (
        <Paper sx={{ p: 3, mb: 2, position: 'relative', overflow: 'hidden', textAlign: 'center', animation: 'sube 0.45s 0.06s ease-out both' }}>
          {fase === 'exito' && resultado ? (
            <Fade in>
              <Box sx={{ position: 'relative' }}>
                <Festejo />
                <Box sx={{
                  width: 84, height: 84, borderRadius: '50%', mx: 'auto', mb: 2,
                  bgcolor: ACENTO, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(200,241,63,0.5)',
                }}>
                  <WhereToVoteIcon sx={{ color: INK, fontSize: 44 }} />
                </Box>
                <Typography variant="h5" mb={0.5}>
                  {resultado.yaRegistrado ? '¡Ya estabas adentro!' : `¡Buen entrenamiento${resultado.nombre ? `, ${resultado.nombre}` : ''}!`}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {resultado.yaRegistrado ? 'Tu asistencia de hoy ya estaba registrada.' : 'Check-in registrado. A romperla 💪'}
                </Typography>

                <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                  <Chip
                    icon={<LocalFireDepartmentIcon sx={{ fontSize: 18 }} />}
                    label={`Racha: ${resultado.racha} ${resultado.racha === 1 ? 'día' : 'días'}`}
                    sx={{ bgcolor: 'rgba(200,241,63,0.14)', color: ACENTO, fontWeight: 800, '& .MuiChip-icon': { color: '#FBBF24' } }}
                  />
                  {resultado.entrenandoAhora > 1 && (
                    <Chip
                      icon={<GroupsIcon sx={{ fontSize: 16 }} />}
                      label={`${resultado.entrenandoAhora} entrenando ahora`}
                      sx={{ bgcolor: 'rgba(139,92,246,0.14)', color: '#C4B5FD', fontWeight: 700, '& .MuiChip-icon': { color: '#C4B5FD' } }}
                    />
                  )}
                </Box>

                {resultado.cuota && !resultado.cuota.vigente && (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 3, bgcolor: 'rgba(251,191,36,0.09)', border: '1px solid rgba(251,191,36,0.25)' }}>
                    <Typography fontSize={13} sx={{ color: '#FBBF24' }} fontWeight={600}>
                      Tu cuota está vencida — pasá por recepción para renovarla 🙌
                    </Typography>
                  </Box>
                )}
              </Box>
            </Fade>
          ) : !info ? (
            <Box>
              <Skeleton variant="circular" width={148} height={148} sx={{ mx: 'auto', mb: 2 }} />
              <Skeleton variant="text" width={180} sx={{ mx: 'auto' }} />
            </Box>
          ) : !info.checkinDisponible ? (
            <Box py={1}>
              <MyLocationIcon sx={{ color: 'text.secondary', fontSize: 34, mb: 1 }} />
              <Typography fontWeight={700} mb={0.5}>Check-in próximamente</Typography>
              <Typography variant="body2" color="text.secondary">
                El gimnasio todavía no habilitó el check-in desde el celular.
              </Typography>
            </Box>
          ) : miDia?.checkinHoy && fase === 'idle' ? (
            <Box py={1}>
              <Box sx={{
                width: 74, height: 74, borderRadius: '50%', mx: 'auto', mb: 1.5,
                bgcolor: 'rgba(200,241,63,0.12)', border: `2px solid ${ACENTO}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircleIcon sx={{ color: ACENTO, fontSize: 40 }} />
              </Box>
              <Typography variant="h6" fontSize={18} mb={0.5}>¡Ya entrenaste hoy!</Typography>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                Tu asistencia quedó registrada. Nos vemos mañana 💪
              </Typography>
              <Chip
                icon={<LocalFireDepartmentIcon sx={{ fontSize: 18 }} />}
                label={`Racha: ${miDia.racha} ${miDia.racha === 1 ? 'día' : 'días'}`}
                sx={{ bgcolor: 'rgba(200,241,63,0.14)', color: ACENTO, fontWeight: 800, '& .MuiChip-icon': { color: '#FBBF24' } }}
              />
            </Box>
          ) : (
            <Box>
              <Box
                onClick={ocupado ? undefined : hacerCheckin}
                sx={{
                  width: 148, height: 148, borderRadius: '50%', mx: 'auto', mb: 2,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                  cursor: ocupado ? 'default' : 'pointer',
                  bgcolor: ACENTO,
                  animation: ocupado ? 'none' : 'latido 2.4s ease-out infinite',
                  transition: 'transform 0.12s',
                  '&:active': { transform: ocupado ? 'none' : 'scale(0.95)' },
                  userSelect: 'none',
                }}
              >
                {ocupado ? (
                  <CircularProgress size={40} sx={{ color: INK }} />
                ) : (
                  <>
                    <WhereToVoteIcon sx={{ color: INK, fontSize: 46 }} />
                    <Typography fontWeight={800} sx={{ color: INK }} fontSize={16} lineHeight={1}>
                      CHECK-IN
                    </Typography>
                  </>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {fase === 'ubicando' ? 'Buscando tu ubicación…'
                  : fase === 'enviando' ? 'Registrando tu llegada…'
                  : 'Tocá cuando llegues al gym'}
              </Typography>
              {fase === 'error' && (
                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 3, bgcolor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
                  <Typography variant="body2" sx={{ color: '#F87171' }}>{error}</Typography>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Acceso rápido a la rutina */}
      <Paper
        onClick={() => navigate('/portal/rutina')}
        sx={{
          p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
          transition: 'border-color 0.15s, transform 0.12s',
          animation: 'sube 0.45s 0.12s ease-out both',
          '&:hover': { borderColor: 'rgba(200,241,63,0.4)' },
          '&:active': { transform: 'scale(0.98)' },
        }}
      >
        <Box sx={{
          width: 42, height: 42, borderRadius: 3, flexShrink: 0,
          background: `linear-gradient(135deg, ${ACENTO} 0%, #9BC426 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FitnessCenterIcon sx={{ color: INK, fontSize: 22 }} />
        </Box>
        <Box flexGrow={1} minWidth={0}>
          <Typography fontWeight={700} fontSize={15}>Rutina de hoy</Typography>
          <Typography variant="body2" color="text.secondary" fontSize={12.5}>
            {sesion ? 'Tu rutina personalizada + rutina del día' : 'Precalentamiento + rutina del día'}
          </Typography>
        </Box>
        <ChevronRightIcon sx={{ color: 'text.secondary' }} />
      </Paper>

      {/* Info del gym: horarios e Instagram */}
      {(info?.horarios || info?.instagram) && (
        <Paper sx={{ p: 1.75, mb: 2, display: 'flex', flexDirection: 'column', gap: 1, animation: 'sube 0.45s 0.15s ease-out both' }}>
          {info.horarios && (
            <Box display="flex" gap={1} alignItems="flex-start">
              <ScheduleIcon sx={{ fontSize: 17, color: ACENTO, mt: 0.2 }} />
              <Typography fontSize={12.5} color="text.secondary">{info.horarios}</Typography>
            </Box>
          )}
          {info.instagram && (
            <Box
              component="a"
              href={`https://instagram.com/${info.instagram}`}
              target="_blank" rel="noopener noreferrer"
              sx={{ display: 'flex', gap: 1, alignItems: 'center', textDecoration: 'none' }}
            >
              <InstagramIcon sx={{ fontSize: 17, color: '#E1306C' }} />
              <Typography fontSize={12.5} fontWeight={600} sx={{ color: ACENTO }}>
                @{info.instagram}
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
