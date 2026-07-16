import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, CircularProgress, Chip,
  Slider, Alert, Divider,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SaveIcon from '@mui/icons-material/Save';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';
import api from '../../services/api';
import { LIMA, INK } from '../../theme';

export default function Configuracion() {
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    api.get('/config').then((r) => setForm(r.data)).catch(() => {
      setAviso({ tipo: 'error', texto: 'No se pudo cargar la configuración' });
    });
  }, []);

  const set = (campo) => (e) => setForm((p) => ({ ...p, [campo]: e.target.value }));

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setAviso({ tipo: 'error', texto: 'Este navegador no permite acceder a la ubicación.' });
      return;
    }
    setUbicando(true);
    setAviso(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
        }));
        setUbicando(false);
        setAviso({
          tipo: 'ok',
          texto: `Ubicación capturada con precisión de ±${Math.round(pos.coords.accuracy)} m. No te olvides de guardar.`,
        });
      },
      (err) => {
        setUbicando(false);
        setAviso({
          tipo: 'error',
          texto: err.code === 1
            ? 'Permití el acceso a la ubicación en el navegador para usar este botón.'
            : 'No pudimos obtener la ubicación. Probá de nuevo con el GPS activado.',
        });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const { data } = await api.put('/config', {
        nombreGym: form.nombreGym,
        telefono: form.telefono || null,
        direccion: form.direccion || null,
        latitud: form.latitud === '' || form.latitud === null ? null : Number(form.latitud),
        longitud: form.longitud === '' || form.longitud === null ? null : Number(form.longitud),
        radioCheckin: form.radioCheckin,
      });
      setForm(data);
      setAviso({ tipo: 'ok', texto: 'Configuración guardada. Los cambios ya están vivos en el portal.' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.response?.data?.error || 'No se pudo guardar' });
    } finally {
      setGuardando(false);
    }
  };

  if (!form) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  const checkinActivo = form.latitud != null && form.latitud !== '' && form.longitud != null && form.longitud !== '';

  return (
    <Box maxWidth={720}>
      <Typography variant="h4" fontSize={26} mb={0.5}>Configuración</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Los datos de tu gimnasio. Cada gym que use la app configura los suyos.
      </Typography>

      {aviso && (
        <Alert severity={aviso.tipo === 'ok' ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setAviso(null)}>
          {aviso.texto}
        </Alert>
      )}

      {/* Identidad */}
      <Paper sx={{ p: 3, mb: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <StorefrontIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography fontWeight={700}>Identidad</Typography>
        </Box>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField label="Nombre del gimnasio" value={form.nombreGym || ''} onChange={set('nombreGym')} fullWidth
            helperText="Aparece en el portal del socio y en su carnet" />
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField label="Teléfono" value={form.telefono || ''} onChange={set('telefono')} sx={{ flex: 1, minWidth: 180 }} />
            <TextField label="Dirección" value={form.direccion || ''} onChange={set('direccion')} sx={{ flex: 2, minWidth: 220 }} />
          </Box>
        </Box>
      </Paper>

      {/* Check-in */}
      <Paper sx={{ p: 3, mb: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <WhereToVoteIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography fontWeight={700}>Check-in por ubicación</Typography>
          <Chip
            size="small"
            label={checkinActivo ? 'Activo' : 'Sin configurar'}
            sx={checkinActivo
              ? { bgcolor: LIMA, color: INK, fontWeight: 800 }
              : { bgcolor: 'rgba(18,22,13,0.08)', fontWeight: 700 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          Los socios solo pueden registrar asistencia si están físicamente cerca del gym.
          Parate en el gimnasio, tocá el botón y guardá: eso es todo.
        </Typography>

        <Button
          variant="contained"
          startIcon={ubicando ? <CircularProgress size={16} color="inherit" /> : <MyLocationIcon />}
          onClick={usarMiUbicacion}
          disabled={ubicando}
          sx={{ mb: 2.5 }}
        >
          {ubicando ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
        </Button>

        <Box display="flex" gap={2} flexWrap="wrap" mb={1}>
          <TextField
            label="Latitud" value={form.latitud ?? ''} onChange={set('latitud')}
            sx={{ flex: 1, minWidth: 160 }} placeholder="-25.2637"
          />
          <TextField
            label="Longitud" value={form.longitud ?? ''} onChange={set('longitud')}
            sx={{ flex: 1, minWidth: 160 }} placeholder="-57.5759"
          />
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
          También podés pegarlas a mano: en Google Maps, clic derecho sobre el gym → copiar coordenadas.
        </Typography>

        <Typography fontWeight={600} fontSize={14} gutterBottom>
          Radio permitido: {form.radioCheckin} metros
        </Typography>
        <Slider
          value={Number(form.radioCheckin) || 150}
          onChange={(_e, v) => setForm((p) => ({ ...p, radioCheckin: v }))}
          min={30} max={500} step={10}
          marks={[{ value: 50, label: '50 m' }, { value: 150, label: '150 m' }, { value: 300, label: '300 m' }, { value: 500, label: '500 m' }]}
          sx={{ maxWidth: 480, color: INK, '& .MuiSlider-thumb': { bgcolor: LIMA, border: `2px solid ${INK}` } }}
        />
        <Typography variant="caption" color="text.secondary" display="block">
          150 m es un buen punto de partida: cubre la vereda y el estacionamiento sin dejar que hagan check-in desde la otra cuadra.
        </Typography>

        <Divider sx={{ my: 2.5 }} />
        <Typography variant="caption" color="text.secondary">
          El GPS del teléfono puede falsearse con apps especiales. Para un gimnasio el riesgo es bajo,
          y el carnet con QR del portal permite verificar la identidad en recepción si hace falta.
        </Typography>
      </Paper>

      <Button
        variant="contained" size="large" startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
        onClick={guardar} disabled={guardando}
      >
        Guardar cambios
      </Button>
    </Box>
  );
}
