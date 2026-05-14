import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Chip, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert, Divider, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../services/api';
import SocioAvatar from '../../components/SocioAvatar';

const RUTINAS_HOMBRE = [
  'Pecho & Tríceps', 'Espalda & Bíceps', 'Piernas & Glúteos', 'Hombros & Abdomen',
  'Full Body Potencia', 'Push Day (Empuje)', 'Pull Day (Jalón)', 'Upper Body Completo',
];
const RUTINAS_MUJER = [
  'Glúteos & Piernas Intensivo', 'Abdomen & Core Total', 'Brazos & Hombros Tonificados',
  'Full Body Femenino', 'Cardio & Tonificación', 'Piernas Completo',
  'Upper Body Femenino', 'Cuerpo Completo Funcional',
];
const RUTINAS_PRECALENTAMIENTO = [
  'Movilidad Articular Completa', 'Activación Cardiovascular',
  'Estiramiento Dinámico', 'Activación Neuromuscular',
];
const RUTINAS_POR_TIPO = { HOMBRE: RUTINAS_HOMBRE, MUJER: RUTINAS_MUJER, PRECALENTAMIENTO: RUTINAS_PRECALENTAMIENTO };

const ESTADO_COLOR      = { ACTIVO: 'success', VENCIDO: 'error', INACTIVO: 'default' };
const ESTADO_PAGO_COLOR = { ACTIVO: 'success', VENCIDO: 'error', CANCELADO: 'default' };
const METODOS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'];

export default function DetalleSocio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openPago,  setOpenPago]  = useState(false);
  const [planes,    setPlanes]    = useState([]);
  const [form,      setForm]      = useState({ planId: '', metodoPago: 'EFECTIVO', observaciones: '' });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const [tipoRutina,     setTipoRutina]     = useState('');
  const [rutinaAsignada, setRutinaAsignada] = useState('');
  const [savingRutina,   setSavingRutina]   = useState(false);
  const [rutinaOk,       setRutinaOk]       = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/socios/${id}`);
      setSocio(data);
      setTipoRutina(data.tipoRutina || '');
      setRutinaAsignada(data.rutinaAsignada || '');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirPago = async () => {
    try {
      const { data } = await api.get('/planes?soloActivos=true');
      setPlanes(data);
      setForm({ planId: '', metodoPago: 'EFECTIVO', observaciones: '' });
      setError('');
      setOpenPago(true);
    } catch {
      setError('Error al cargar los planes');
    }
  };

  const guardarRutina = async () => {
    setSavingRutina(true); setRutinaOk(false);
    try {
      await api.put(`/socios/${id}`, { tipoRutina: tipoRutina || null, rutinaAsignada: rutinaAsignada || null });
      setRutinaOk(true);
      setTimeout(() => setRutinaOk(false), 2500);
    } finally { setSavingRutina(false); }
  };

  const guardarPago = async () => {
    setError(''); setSaving(true);
    try {
      await api.post('/pagos', {
        socioId: parseInt(id),
        planId: parseInt(form.planId),
        metodoPago: form.metodoPago,
        observaciones: form.observaciones,
      });
      setOpenPago(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar pago');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (!socio) return null;

  const pagoActivo   = socio.pagos.find(p => p.estado === 'ACTIVO');
  const totalPagado  = socio.pagos.reduce((acc, p) => acc + p.monto, 0);
  const mesesComoSocio = Math.floor(
    (new Date() - new Date(socio.fechaAlta)) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <Box>
      {/* Cabecera */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/socios')}><ArrowBackIcon /></IconButton>
        <SocioAvatar socio={socio} size={56} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700}>{socio.apellido}, {socio.nombre}</Typography>
          <Typography variant="body2" color="text.secondary">{socio.email}</Typography>
        </Box>
        <Chip label={socio.estado} color={ESTADO_COLOR[socio.estado]} />
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/socios/${id}`)}>
          Editar
        </Button>
      </Box>

      {/* Tarjetas de resumen */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Datos del socio</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">DNI</Typography>
                  <Typography>{socio.dni || '-'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Teléfono</Typography>
                  <Typography>{socio.telefono || '-'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Email</Typography>
                  <Typography>{socio.email || '-'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Sexo</Typography>
                  <Typography>{{ MASCULINO: 'Masculino', FEMENINO: 'Femenino', OTROS: 'Otros' }[socio.sexo] ?? '-'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Fecha de alta</Typography>
                  <Typography>{new Date(socio.fechaAlta).toLocaleDateString('es-AR')}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Plan activo</Typography>
                  <Typography>{pagoActivo?.plan?.nombre || 'Sin plan'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Vencimiento</Typography>
                  <Typography>
                    {pagoActivo ? new Date(pagoActivo.fechaVencimiento).toLocaleDateString('es-AR') : '-'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Estadísticas</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Total pagado</Typography>
                  <Typography fontWeight={700} color="success.main">
                    ${Number(totalPagado).toLocaleString('es-AR')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Cantidad de pagos</Typography>
                  <Typography>{socio.pagos.length}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Meses como socio</Typography>
                  <Typography>{mesesComoSocio}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rutina asignada */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FitnessCenterIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>Rutina asignada (portal del socio)</Typography>
          </Box>
          {rutinaOk && <Alert severity="success" sx={{ mb: 1.5 }}>Rutina guardada correctamente</Alert>}
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ sm: 'flex-end' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Tipo de rutina</InputLabel>
              <Select
                label="Tipo de rutina"
                value={tipoRutina}
                onChange={e => { setTipoRutina(e.target.value); setRutinaAsignada(''); }}
              >
                <MenuItem value=""><em>Sin asignar</em></MenuItem>
                <MenuItem value="HOMBRE">Hombres</MenuItem>
                <MenuItem value="MUJER">Mujeres</MenuItem>
                <MenuItem value="PRECALENTAMIENTO">Precalentamiento</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1, minWidth: 200 }} disabled={!tipoRutina}>
              <InputLabel>Rutina específica</InputLabel>
              <Select
                label="Rutina específica"
                value={rutinaAsignada}
                onChange={e => setRutinaAsignada(e.target.value)}
              >
                <MenuItem value=""><em>Seleccioná una rutina</em></MenuItem>
                {(RUTINAS_POR_TIPO[tipoRutina] || []).map(r => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={savingRutina ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={guardarRutina}
              disabled={savingRutina}
              size="small"
              sx={{ height: 40, flexShrink: 0 }}
            >
              Guardar
            </Button>
          </Box>
          {tipoRutina && rutinaAsignada && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              El socio verá esta rutina en <strong>tugymonline.vercel.app/portal</strong>
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Historial de pagos */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>Historial de pagos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirPago}>
          Registrar pago
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Plan', 'Monto', 'Fecha pago', 'Vencimiento', 'Método', 'Estado'].map(h => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {socio.pagos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Sin pagos registrados
                </TableCell>
              </TableRow>
            ) : socio.pagos.map(p => (
              <TableRow key={p.id} hover>
                <TableCell>{p.plan?.nombre}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                  ${Number(p.monto).toLocaleString('es-AR')}
                </TableCell>
                <TableCell>{new Date(p.fechaPago).toLocaleDateString('es-AR')}</TableCell>
                <TableCell>{new Date(p.fechaVencimiento).toLocaleDateString('es-AR')}</TableCell>
                <TableCell>{p.metodoPago}</TableCell>
                <TableCell>
                  <Chip label={p.estado} color={ESTADO_PAGO_COLOR[p.estado]} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog registro de pago */}
      <Dialog open={openPago} onClose={() => setOpenPago(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar pago — {socio.apellido}, {socio.nombre}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <FormControl fullWidth required>
              <InputLabel>Plan</InputLabel>
              <Select
                label="Plan"
                value={form.planId}
                onChange={e => setForm(p => ({ ...p, planId: e.target.value }))}
              >
                {planes.map(pl => (
                  <MenuItem key={pl.id} value={pl.id}>
                    {pl.nombre} — ${Number(pl.precio).toLocaleString('es-AR')} ({pl.duracionDias} días)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Método de pago</InputLabel>
              <Select
                label="Método de pago"
                value={form.metodoPago}
                onChange={e => setForm(p => ({ ...p, metodoPago: e.target.value }))}
              >
                {METODOS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Observaciones"
              value={form.observaciones}
              onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
              multiline rows={2} fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPago(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarPago} disabled={saving || !form.planId}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Confirmar pago'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
