import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Tabs, Tab, Chip, Tooltip, Link, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Alert, Snackbar, Skeleton,
  CircularProgress, useTheme, useMediaQuery,
} from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../services/api';
import { avisarCambioSolicitudes } from '../../components/Layout/useSolicitudesPendientes';

const TABS = [
  { estado: 'PENDIENTE', label: 'Pendientes' },
  { estado: 'APROBADA',  label: 'Aprobadas'  },
  { estado: 'RECHAZADA', label: 'Rechazadas' },
];

const VACIO = {
  PENDIENTE: 'No hay solicitudes pendientes. Los visitantes pueden pedir el alta desde la portada.',
  APROBADA:  'Todavía no aprobaste ninguna solicitud.',
  RECHAZADA: 'No hay solicitudes rechazadas.',
};

const SEXOS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO',  label: 'Femenino'  },
  { value: 'OTROS',     label: 'Otros'     },
];

/* Alto mínimo táctil en mobile para botones de acción */
const BOTON_TACTIL = { minHeight: { xs: 44, sm: 36 } };

/* ── Fechas ── */
const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

function fechaRelativa(iso) {
  if (!iso) return '';
  const diffSeg = Math.round((new Date(iso) - Date.now()) / 1000);
  const abs = Math.abs(diffSeg);
  if (abs < 60)        return 'recién';
  if (abs < 3600)      return rtf.format(Math.round(diffSeg / 60), 'minute');
  if (abs < 86400)     return rtf.format(Math.round(diffSeg / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSeg / 86400), 'day');
  return rtf.format(Math.round(diffSeg / (86400 * 30)), 'month');
}

function fechaAbsoluta(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* Para el input type="date": tomamos la parte de fecha del ISO sin pasar por
   Date, así no se corre un día por la zona horaria. */
function fechaParaInput(iso) {
  if (!iso) return '';
  return String(iso).slice(0, 10);
}

function formDesde(s) {
  return {
    nombre:        s.nombre || '',
    apellido:      s.apellido || '',
    email:         s.email || '',
    telefono:      s.telefono || '',
    sexo:          s.sexo || 'OTROS',
    fechaNac:      fechaParaInput(s.fechaNac),
    observaciones: s.mensaje ? `Solicitud desde la portada: ${s.mensaje}` : '',
  };
}

/* ── Piezas de la lista ── */
function Contacto({ s, caption = false }) {
  const Tipo = caption ? 'caption' : 'body2';
  if (!s.email && !s.telefono) return <Typography variant={Tipo} color="text.secondary">Sin contacto</Typography>;
  return (
    <Box>
      {s.email && <Typography variant={Tipo} display="block" sx={{ wordBreak: 'break-all' }}>{s.email}</Typography>}
      {s.telefono && <Typography variant={Tipo} display="block" color="text.secondary">{s.telefono}</Typography>}
    </Box>
  );
}

function Mensaje({ texto, maxWidth = 240 }) {
  if (!texto) return <Typography variant="body2" color="text.secondary">—</Typography>;
  return (
    <Tooltip title={texto} placement="top-start" enterTouchDelay={0}>
      <Typography variant="body2" noWrap sx={{ maxWidth, cursor: 'help' }}>{texto}</Typography>
    </Tooltip>
  );
}

function LinkSocio({ s }) {
  const navigate = useNavigate();
  if (!s.socioId) return <Typography variant="body2" color="text.secondary">—</Typography>;
  const nombre = s.socio ? `${s.socio.apellido}, ${s.socio.nombre}` : 'Ver socio';
  return (
    <Link
      component="button"
      type="button"
      variant="body2"
      fontWeight={600}
      underline="hover"
      onClick={() => navigate(`/socios/${s.socioId}/detalle`)}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minHeight: { xs: 44, sm: 'auto' } }}
    >
      {nombre} <OpenInNewIcon sx={{ fontSize: 14 }} />
    </Link>
  );
}

export default function Solicitudes() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [estado, setEstado]           = useState('PENDIENTE');
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Dialog aprobar
  const [aprobar, setAprobar]         = useState(null); // solicitud
  const [form, setForm]               = useState(null);
  const [aprobando, setAprobando]     = useState(false);
  const [errorAprobar, setErrorAprobar] = useState('');

  // Dialog rechazar
  const [rechazar, setRechazar]       = useState(null); // solicitud
  const [motivo, setMotivo]           = useState('');
  const [rechazando, setRechazando]   = useState(false);
  const [errorRechazar, setErrorRechazar] = useState('');

  // Snackbar
  /* El contenido se conserva al cerrar para que la animación de salida no muestre un snackbar vacío. */
  const [snack, setSnack]             = useState(null); // { mensaje, socioId?, severity }
  const [snackOpen, setSnackOpen]     = useState(false);
  const mostrarSnack = (datos) => { setSnack(datos); setSnackOpen(true); };
  const cerrarSnack  = () => setSnackOpen(false);

  const cargar = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/solicitudes', { params: { estado } });
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las solicitudes. Revisá la conexión e intentá de nuevo.');
    } finally { setLoading(false); }
  }, [estado]);

  useEffect(() => { cargar(); }, [cargar]);

  /* ── Aprobar ── */
  const abrirAprobar = (s) => { setAprobar(s); setForm(formDesde(s)); setErrorAprobar(''); };
  const cerrarAprobar = () => { if (!aprobando) { setAprobar(null); setForm(null); } };
  const handleForm = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const confirmarAprobar = async (e) => {
    e.preventDefault();
    if (!aprobar || !form) return;
    setErrorAprobar(''); setAprobando(true);
    try {
      // Solo mandamos lo que tiene valor: el backend completa el resto desde la solicitud.
      const body = {};
      for (const [k, v] of Object.entries(form)) {
        const val = typeof v === 'string' ? v.trim() : v;
        if (val !== '' && val != null) body[k] = val;
      }
      const { data } = await api.post(`/solicitudes/${aprobar.id}/aprobar`, body);
      const socioId = data?.socio?.id;
      const nombre  = data?.socio ? `${data.socio.nombre} ${data.socio.apellido}` : `${form.nombre} ${form.apellido}`;
      setAprobar(null); setForm(null);
      mostrarSnack({
        severity: 'success',
        socioId,
        mensaje: `${nombre} ya es socio y puede entrar al portal con su DNI. Falta cobrarle la primera cuota.`,
      });
      avisarCambioSolicitudes();
      cargar();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error;
      setErrorAprobar(
        msg || (status === 409
          ? 'Ya existe un socio con ese DNI o email, o la solicitud ya fue resuelta.'
          : 'No se pudo aprobar la solicitud. Intentá de nuevo.'),
      );
    } finally { setAprobando(false); }
  };

  /* ── Rechazar ── */
  const abrirRechazar = (s) => { setRechazar(s); setMotivo(''); setErrorRechazar(''); };
  const cerrarRechazar = () => { if (!rechazando) setRechazar(null); };

  const confirmarRechazar = async () => {
    if (!rechazar) return;
    setErrorRechazar(''); setRechazando(true);
    try {
      const body = motivo.trim() ? { motivo: motivo.trim() } : {};
      await api.post(`/solicitudes/${rechazar.id}/rechazar`, body);
      setRechazar(null);
      mostrarSnack({ severity: 'info', mensaje: `Solicitud de ${rechazar.nombre} ${rechazar.apellido} rechazada.` });
      avisarCambioSolicitudes();
      cargar();
    } catch (err) {
      setErrorRechazar(err.response?.data?.error || 'No se pudo rechazar la solicitud. Intentá de nuevo.');
    } finally { setRechazando(false); }
  };

  const esPendiente = estado === 'PENDIENTE';
  const esAprobada  = estado === 'APROBADA';

  /* ── Render de acciones / columna final según tab ── */
  const columnaFinal = (s) => {
    if (esPendiente) {
      return (
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="contained" size="small" startIcon={<CheckIcon />} onClick={() => abrirAprobar(s)} sx={BOTON_TACTIL}>
            Aprobar
          </Button>
          <Button variant="outlined" color="error" size="small" startIcon={<CloseIcon />} onClick={() => abrirRechazar(s)} sx={BOTON_TACTIL}>
            Rechazar
          </Button>
        </Box>
      );
    }
    if (esAprobada) return <LinkSocio s={s} />;
    return s.motivoRechazo
      ? <Typography variant="body2">{s.motivoRechazo}</Typography>
      : <Typography variant="body2" color="text.secondary">Sin motivo</Typography>;
  };

  const encabezados = ['Solicitante', 'DNI', 'Contacto', 'Solicitud', 'Mensaje',
    esPendiente ? 'Acciones' : esAprobada ? 'Socio creado' : 'Motivo'];

  const skeletonFilas = [0, 1, 2];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={1} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={1.5}>
          <HowToRegIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Solicitudes de alta</Typography>
          {!loading && !error && (
            <Typography variant="body2" color="text.secondary">({solicitudes.length})</Typography>
          )}
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={cargar} disabled={loading} size="small" sx={BOTON_TACTIL}>
          Actualizar
        </Button>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={estado}
          onChange={(_, v) => setEstado(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{ px: { sm: 1 }, '& .MuiTab-root': { minHeight: 48, fontWeight: 700, textTransform: 'none' } }}
        >
          {TABS.map(t => <Tab key={t.estado} value={t.estado} label={t.label} />)}
        </Tabs>
      </Paper>

      {error && (
        <Alert
          severity="error" sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={cargar}>Reintentar</Button>}
        >
          {error}
        </Alert>
      )}

      {!loading && !error && solicitudes.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HowToRegIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">{VACIO[estado]}</Typography>
        </Paper>
      )}

      {/* Mobile: tarjetas */}
      {isMobile ? (
        <Box display="flex" flexDirection="column" gap={1}>
          {loading ? skeletonFilas.map(i => (
            <Paper key={i} sx={{ p: 1.5 }}>
              <Skeleton width="60%" height={24} />
              <Skeleton width="40%" />
              <Skeleton width="80%" />
            </Paper>
          )) : solicitudes.map(s => (
            <Paper key={s.id} sx={{ p: 1.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                <Box minWidth={0} flex={1}>
                  <Typography fontWeight={600} fontSize={15}>{s.apellido}, {s.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    DNI {s.dni || '-'}
                  </Typography>
                </Box>
                <Tooltip title={fechaAbsoluta(s.createdAt)} enterTouchDelay={0}>
                  <Chip label={fechaRelativa(s.createdAt)} size="small" variant="outlined" />
                </Tooltip>
              </Box>
              <Box mt={1}><Contacto s={s} caption /></Box>
              {s.mensaje && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                  “{s.mensaje}”
                </Typography>
              )}
              <Box mt={1.5}>
                {esPendiente ? (
                  <Box display="flex" gap={1}>
                    <Button variant="contained" fullWidth startIcon={<CheckIcon />} onClick={() => abrirAprobar(s)} sx={BOTON_TACTIL}>
                      Aprobar
                    </Button>
                    <Button variant="outlined" color="error" fullWidth startIcon={<CloseIcon />} onClick={() => abrirRechazar(s)} sx={BOTON_TACTIL}>
                      Rechazar
                    </Button>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      {esAprobada ? 'Socio creado:' : 'Motivo:'}
                    </Typography>
                    {columnaFinal(s)}
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        /* Desktop: tabla */
        (loading || solicitudes.length > 0) && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {encabezados.map(h => <TableCell key={h}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? skeletonFilas.map(i => (
                  <TableRow key={i}>
                    {encabezados.map(h => <TableCell key={h}><Skeleton /></TableCell>)}
                  </TableRow>
                )) : solicitudes.map(s => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{s.apellido}, {s.nombre}</Typography>
                    </TableCell>
                    <TableCell>{s.dni || '-'}</TableCell>
                    <TableCell><Contacto s={s} /></TableCell>
                    <TableCell>
                      <Typography variant="body2">{fechaRelativa(s.createdAt)}</Typography>
                      <Typography variant="caption" color="text.secondary">{fechaAbsoluta(s.createdAt)}</Typography>
                    </TableCell>
                    <TableCell><Mensaje texto={s.mensaje} /></TableCell>
                    <TableCell>{columnaFinal(s)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* ── Dialog: aprobar ── */}
      <Dialog open={Boolean(aprobar)} onClose={cerrarAprobar} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <Box component="form" onSubmit={confirmarAprobar}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HowToRegIcon color="primary" /> Aprobar solicitud
          </DialogTitle>
          <DialogContent>
            {form && (
              <Box display="flex" flexDirection="column" gap={2} mt={1}>
                <Alert severity="info" icon={false}>
                  El socio va a poder entrar al portal con su DNI <strong>{aprobar?.dni}</strong> y la contraseña que eligió.
                  Después de aprobar, registrale la primera cuota desde su ficha.
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleForm} required fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Apellido" name="apellido" value={form.apellido} onChange={handleForm} required fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="DNI" value={aprobar?.dni || ''} fullWidth disabled helperText="Lo cargó el visitante; no se edita acá" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Teléfono" name="telefono" value={form.telefono} onChange={handleForm} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Email" name="email" type="email" value={form.email} onChange={handleForm} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sexo</InputLabel>
                      <Select label="Sexo" name="sexo" value={form.sexo} onChange={handleForm}>
                        {SEXOS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Fecha de nacimiento" name="fechaNac" type="date" value={form.fechaNac}
                      onChange={handleForm} fullWidth InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Observaciones" name="observaciones" value={form.observaciones}
                      onChange={handleForm} multiline rows={3} fullWidth />
                  </Grid>
                </Grid>
                {errorAprobar && <Alert severity="error" onClose={() => setErrorAprobar('')}>{errorAprobar}</Alert>}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
            <Button onClick={cerrarAprobar} disabled={aprobando} sx={BOTON_TACTIL}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={aprobando} startIcon={aprobando ? null : <CheckIcon />} sx={BOTON_TACTIL}>
              {aprobando ? <CircularProgress size={20} color="inherit" /> : 'Aprobar y crear socio'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ── Dialog: rechazar ── */}
      <Dialog open={Boolean(rechazar)} onClose={cerrarRechazar} maxWidth="xs" fullWidth>
        <DialogTitle>Rechazar solicitud</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Typography variant="body2">
              ¿Rechazar la solicitud de <strong>{rechazar?.nombre} {rechazar?.apellido}</strong> (DNI {rechazar?.dni})?
              No se crea ningún socio.
            </Typography>
            <TextField
              label="Motivo (opcional)" value={motivo} onChange={e => setMotivo(e.target.value)}
              multiline rows={2} fullWidth autoFocus
              placeholder="Ej.: datos incompletos, ya es socio, no se presentó"
            />
            {errorRechazar && <Alert severity="error" onClose={() => setErrorRechazar('')}>{errorRechazar}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={cerrarRechazar} disabled={rechazando} sx={BOTON_TACTIL}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={confirmarRechazar} disabled={rechazando} sx={BOTON_TACTIL}>
            {rechazando ? <CircularProgress size={20} color="inherit" /> : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={snack?.socioId ? 10000 : 5000}
        onClose={(_, reason) => { if (reason !== 'clickaway') cerrarSnack(); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack?.severity || 'success'}
          variant="filled"
          onClose={cerrarSnack}
          sx={{ width: '100%', alignItems: 'center' }}
          action={snack?.socioId ? (
            <Button color="inherit" size="small" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}
              onClick={() => { cerrarSnack(); navigate(`/socios/${snack.socioId}/detalle`); }}>
              Ir al socio
            </Button>
          ) : undefined}
        >
          {snack?.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}
