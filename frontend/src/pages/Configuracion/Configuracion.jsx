import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, CircularProgress, Chip,
  Slider, Alert, Divider, Switch, FormControlLabel, Select, MenuItem,
  FormControl, InputLabel, InputAdornment, Tabs, Tab,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SaveIcon from '@mui/icons-material/Save';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';
import PaymentsIcon from '@mui/icons-material/Payments';
import ForumIcon from '@mui/icons-material/Forum';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import api from '../../services/api';
import { ACENTO, INK } from '../../theme';
import { MSG_MOROSO_DEFAULT, MSG_RECUPERACION_DEFAULT } from '../../utils/whatsapp';

export default function Configuracion() {
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState(0);
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
        setForm((p) => ({ ...p, latitud: pos.coords.latitude, longitud: pos.coords.longitude }));
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
        instagram: form.instagram || null,
        horarios: form.horarios || null,
        latitud: form.latitud === '' || form.latitud === null ? null : Number(form.latitud),
        longitud: form.longitud === '' || form.longitud === null ? null : Number(form.longitud),
        radioCheckin: form.radioCheckin,
        checkinVentanaHs: form.checkinVentanaHs,
        diaPagoDesde: form.diaPagoDesde,
        diaPagoHasta: form.diaPagoHasta,
        recargoActivo: form.recargoActivo,
        recargoTipo: form.recargoTipo,
        recargoValor: form.recargoValor === '' ? 0 : Number(form.recargoValor),
        diasAviso: form.diasAviso,
        msgMoroso: form.msgMoroso || null,
        msgRecuperacion: form.msgRecuperacion || null,
      });
      setForm(data);
      setAviso({ tipo: 'ok', texto: 'Configuración guardada. Los cambios ya están vivos.' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.response?.data?.error || 'No se pudo guardar' });
    } finally {
      setGuardando(false);
    }
  };

  if (!form) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  const checkinActivo = form.latitud != null && form.latitud !== '' && form.longitud != null && form.longitud !== '';

  return (
    <Box maxWidth={760}>
      <Typography variant="h4" fontSize={26} mb={0.5}>Configuración</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Todo lo configurable de tu gimnasio, en un solo lugar. Cada gym que use la app define lo suyo.
      </Typography>

      {aviso && (
        <Alert severity={aviso.tipo === 'ok' ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setAviso(null)}>
          {aviso.texto}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2.5 }} variant="scrollable" allowScrollButtonsMobile>
        <Tab icon={<StorefrontIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Identidad" />
        <Tab icon={<WhereToVoteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Check-in" />
        <Tab icon={<PaymentsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Pagos y recargos" />
        <Tab icon={<ForumIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Comunicación" />
      </Tabs>

      {/* ── IDENTIDAD ── */}
      {tab === 0 && (
        <Paper sx={{ p: 3, mb: 2.5 }}>
          <Box display="flex" flexDirection="column" gap={2.5}>
            <TextField label="Nombre del gimnasio" value={form.nombreGym || ''} onChange={set('nombreGym')} fullWidth
              helperText="Aparece en el portal del socio y en su carnet" />
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField label="Teléfono" value={form.telefono || ''} onChange={set('telefono')} sx={{ flex: 1, minWidth: 180 }} />
              <TextField label="Dirección" value={form.direccion || ''} onChange={set('direccion')} sx={{ flex: 2, minWidth: 220 }} />
            </Box>
            <TextField
              label="Instagram" value={form.instagram || ''} onChange={set('instagram')}
              sx={{ maxWidth: 320 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><InstagramIcon sx={{ fontSize: 18 }} /> @</InputAdornment> }}
              helperText="El portal del socio muestra el link a tu cuenta"
            />
            <TextField
              label="Horarios de atención" value={form.horarios || ''} onChange={set('horarios')} fullWidth
              placeholder="Lun a Vie 7 a 23 hs · Sáb 9 a 13 hs"
              helperText="Texto libre: se muestra tal cual en el portal del socio"
            />
          </Box>
        </Paper>
      )}

      {/* ── CHECK-IN ── */}
      {tab === 1 && (
        <Paper sx={{ p: 3, mb: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography fontWeight={700}>Check-in por ubicación</Typography>
            <Chip
              size="small"
              label={checkinActivo ? 'Activo' : 'Sin configurar'}
              sx={checkinActivo
                ? { bgcolor: ACENTO, color: '#fff', fontWeight: 800 }
                : { bgcolor: 'rgba(13,20,36,0.08)', fontWeight: 700 }}
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
            <TextField label="Latitud" value={form.latitud ?? ''} onChange={set('latitud')}
              sx={{ flex: 1, minWidth: 160 }} placeholder="-25.2637" />
            <TextField label="Longitud" value={form.longitud ?? ''} onChange={set('longitud')}
              sx={{ flex: 1, minWidth: 160 }} placeholder="-57.5759" />
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
            sx={{ maxWidth: 480, color: INK, '& .MuiSlider-thumb': { bgcolor: ACENTO, border: `2px solid ${INK}` } }}
          />
          <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
            150 m es un buen punto de partida: cubre la vereda y el estacionamiento.
          </Typography>

          <Divider sx={{ mb: 2.5 }} />

          <TextField
            label="Horas entre check-ins" type="number"
            value={form.checkinVentanaHs ?? 3}
            onChange={(e) => setForm((p) => ({ ...p, checkinVentanaHs: parseInt(e.target.value || 3, 10) }))}
            inputProps={{ min: 1, max: 24 }}
            sx={{ width: 210 }}
            helperText="Dentro de esta ventana no se cuenta un segundo check-in, y ningún otro socio puede registrarse desde el mismo teléfono"
          />
        </Paper>
      )}

      {/* ── PAGOS Y RECARGOS ── */}
      {tab === 2 && (
        <Paper sx={{ p: 3, mb: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography fontWeight={700}>Recargo por pago fuera de término</Typography>
            <Chip
              size="small"
              label={form.recargoActivo ? 'Activo' : 'Desactivado'}
              sx={form.recargoActivo
                ? { bgcolor: ACENTO, color: '#fff', fontWeight: 800 }
                : { bgcolor: 'rgba(13,20,36,0.08)', fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Definí la ventana de pago del mes. Quien paga después del último día de la ventana
            abona la cuota con recargo. Los pases diarios nunca llevan recargo.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={Boolean(form.recargoActivo)}
                onChange={(e) => setForm((p) => ({ ...p, recargoActivo: e.target.checked }))}
              />
            }
            label={<Typography fontWeight={600} fontSize={14}>Cobrar recargo por pago fuera de término</Typography>}
            sx={{ mb: form.recargoActivo ? 2 : 0 }}
          />

          {form.recargoActivo && (
            <>
              <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                <TextField
                  label="Ventana: desde el día" type="number"
                  value={form.diaPagoDesde ?? 1}
                  onChange={(e) => setForm((p) => ({ ...p, diaPagoDesde: parseInt(e.target.value || 1, 10) }))}
                  inputProps={{ min: 1, max: 28 }}
                  sx={{ width: 170 }}
                />
                <TextField
                  label="hasta el día" type="number"
                  value={form.diaPagoHasta ?? 10}
                  onChange={(e) => setForm((p) => ({ ...p, diaPagoHasta: parseInt(e.target.value || 10, 10) }))}
                  inputProps={{ min: 1, max: 28 }}
                  sx={{ width: 150 }}
                  helperText="máx. 28"
                />
              </Box>
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">
                <FormControl sx={{ minWidth: 190 }}>
                  <InputLabel>Tipo de recargo</InputLabel>
                  <Select
                    label="Tipo de recargo"
                    value={form.recargoTipo || 'PORCENTAJE'}
                    onChange={(e) => setForm((p) => ({ ...p, recargoTipo: e.target.value }))}
                  >
                    <MenuItem value="PORCENTAJE">Porcentaje de la cuota</MenuItem>
                    <MenuItem value="FIJO">Monto fijo</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Valor" type="number"
                  value={form.recargoValor ?? 10}
                  onChange={(e) => setForm((p) => ({ ...p, recargoValor: e.target.value }))}
                  InputProps={{
                    startAdornment: form.recargoTipo === 'FIJO' ? <InputAdornment position="start">$</InputAdornment> : undefined,
                    endAdornment: form.recargoTipo !== 'FIJO' ? <InputAdornment position="end">%</InputAdornment> : undefined,
                  }}
                  sx={{ width: 150 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                Ejemplo: una cuota de $50.000 pagada después del día {form.diaPagoHasta ?? 10} sale{' '}
                <strong>
                  ${(50000 + (form.recargoTipo === 'FIJO'
                    ? Number(form.recargoValor || 0)
                    : Math.round(50000 * Number(form.recargoValor || 0) / 100))).toLocaleString('es-AR')}
                </strong>. Al registrar el pago podés eximir el recargo si hace falta.
              </Typography>
            </>
          )}
        </Paper>
      )}

      {/* ── COMUNICACIÓN ── */}
      {tab === 3 && (
        <Paper sx={{ p: 3, mb: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <WhatsAppIcon sx={{ color: '#25D366', fontSize: 20 }} />
            <Typography fontWeight={700}>Mensajes de WhatsApp</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            Los textos que salen pre-armados al tocar "Avisar" o "Recuperar".
            Usá <strong>{'{nombre}'}</strong> y <strong>{'{dias}'}</strong> donde quieras que aparezcan los datos del socio.
          </Typography>

          <TextField
            label="Aviso de cuota vencida (morosos)"
            value={form.msgMoroso ?? ''}
            onChange={set('msgMoroso')}
            placeholder={MSG_MOROSO_DEFAULT}
            multiline rows={3} fullWidth sx={{ mb: 2.5 }}
            helperText="Vacío = usa el mensaje estándar. Variable disponible: {nombre}"
          />
          <TextField
            label="Recuperación de socios que dejaron de venir"
            value={form.msgRecuperacion ?? ''}
            onChange={set('msgRecuperacion')}
            placeholder={MSG_RECUPERACION_DEFAULT}
            multiline rows={3} fullWidth sx={{ mb: 2.5 }}
            helperText="Vacío = usa el mensaje estándar. Variables: {nombre} y {dias} (días sin venir)"
          />

          <Divider sx={{ mb: 2.5 }} />

          <TextField
            label="Días de anticipación para avisos de vencimiento" type="number"
            value={form.diasAviso ?? 3}
            onChange={(e) => setForm((p) => ({ ...p, diasAviso: parseInt(e.target.value || 3, 10) }))}
            inputProps={{ min: 1, max: 30 }}
            sx={{ width: 320 }}
            helperText='La tarjeta "Cuotas a Vencer" del dashboard cuenta las que vencen dentro de estos días'
          />
        </Paper>
      )}

      <Button
        variant="contained" size="large" startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
        onClick={guardar} disabled={guardando}
      >
        Guardar cambios
      </Button>
    </Box>
  );
}
