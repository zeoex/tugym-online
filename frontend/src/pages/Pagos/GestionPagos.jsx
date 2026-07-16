import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, CircularProgress, Autocomplete, Alert,
  useTheme, useMediaQuery, FormControlLabel, Checkbox, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import api from '../../services/api';

const METODOS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'];
const ESTADO_COLOR = { ACTIVO: 'success', VENCIDO: 'error', CANCELADO: 'default' };

export default function GestionPagos() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [pagos, setPagos]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]     = useState(false);
  const [planes, setPlanes] = useState([]);
  const [socios, setSocios] = useState([]);
  const [form, setForm]     = useState({ socio: null, planId: '', metodoPago: 'EFECTIVO', observaciones: '' });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const [recargoInfo, setRecargoInfo]     = useState(null);
  const [aplicarRecargo, setAplicarRecargo] = useState(true);

  // Al elegir plan, el servidor dice si hoy corresponde recargo por pago fuera de término.
  useEffect(() => {
    if (!form.planId) { setRecargoInfo(null); return; }
    setAplicarRecargo(true);
    api.get('/pagos/recargo-info', { params: { planId: form.planId } })
      .then((r) => setRecargoInfo(r.data))
      .catch(() => setRecargoInfo(null));
  }, [form.planId]);

  const cargar = async () => {
    setLoading(true);
    try { const { data } = await api.get('/pagos'); setPagos(data.datos); setTotal(data.total); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirDialog = async () => {
    const [p, s] = await Promise.all([api.get('/planes?soloActivos=true'), api.get('/socios?limit=200')]);
    setPlanes(p.data); setSocios(s.data.datos); setOpen(true);
  };

  const guardar = async () => {
    setError(''); setSaving(true);
    try {
      await api.post('/pagos', {
        socioId: form.socio?.id,
        planId: form.planId,
        metodoPago: form.metodoPago,
        observaciones: form.observaciones,
        aplicarRecargo: recargoInfo?.aplica ? aplicarRecargo : undefined,
      });
      setOpen(false); setForm({ socio: null, planId: '', metodoPago: 'EFECTIVO', observaciones: '' });
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al registrar pago'); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <PaymentIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Pagos</Typography>
          <Typography variant="body2" color="text.secondary">({total})</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirDialog} size={isMobile ? 'small' : 'medium'}>
          {isMobile ? 'Registrar' : 'Registrar pago'}
        </Button>
      </Box>

      {/* Mobile: tarjetas */}
      {isMobile ? (
        <Box display="flex" flexDirection="column" gap={1}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
          ) : pagos.map(p => (
            <Paper key={p.id} sx={{ p: 1.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                <Typography fontWeight={600} fontSize={14}>{p.socio?.apellido}, {p.socio?.nombre}</Typography>
                <Chip label={p.estado} color={ESTADO_COLOR[p.estado]} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary" mb={0.5}>{p.plan?.nombre}</Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={700} color="success.main">
                  ${Number(p.monto).toLocaleString('es-AR')}
                  {p.recargo > 0 && (
                    <Typography component="span" variant="caption" sx={{ color: 'warning.main', fontWeight: 700, ml: 0.5 }}>
                      +rec.
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">{p.metodoPago}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {new Date(p.fechaPago).toLocaleDateString('es-AR')} → vence {new Date(p.fechaVencimiento).toLocaleDateString('es-AR')}
              </Typography>
            </Paper>
          ))}
        </Box>
      ) : (
        /* Desktop: tabla */
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Socio', 'Plan', 'Monto', 'Fecha pago', 'Vencimiento', 'Método', 'Estado'].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={28} sx={{ my: 2 }} /></TableCell></TableRow>
              ) : pagos.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.socio?.apellido}, {p.socio?.nombre}</TableCell>
                  <TableCell>{p.plan?.nombre}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                    ${Number(p.monto).toLocaleString('es-AR')}
                    {p.recargo > 0 && (
                      <Tooltip title={`Incluye recargo por pago fuera de término`} arrow>
                        <Typography component="span" variant="caption" sx={{ color: 'warning.main', fontWeight: 700, ml: 0.75 }}>
                          +${Number(p.recargo).toLocaleString('es-AR')} rec.
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>{new Date(p.fechaPago).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell>{new Date(p.fechaVencimiento).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell>{p.metodoPago}</TableCell>
                  <TableCell><Chip label={p.estado} color={ESTADO_COLOR[p.estado]} size="small" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog registrar pago */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon color="primary" /> Registrar pago
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <Autocomplete
              options={socios}
              getOptionLabel={s => `${s.apellido}, ${s.nombre} (${s.dni || 'S/DNI'})`}
              value={form.socio}
              onChange={(_, v) => setForm(p => ({ ...p, socio: v }))}
              renderInput={params => <TextField {...params} label="Socio" required />}
            />
            <FormControl fullWidth required>
              <InputLabel>Plan</InputLabel>
              <Select label="Plan" value={form.planId} onChange={e => setForm(p => ({ ...p, planId: e.target.value }))}>
                {planes.map(pl => (
                  <MenuItem key={pl.id} value={pl.id}>
                    {pl.nombre} — ${Number(pl.precio).toLocaleString('es-AR')} ({pl.duracionDias} días)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Desglose de recargo por pago fuera de término */}
            {recargoInfo?.aplica && (
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'rgba(217,119,6,0.06)', borderColor: 'rgba(217,119,6,0.35)' }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <ScheduleIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                  <Typography fontWeight={700} fontSize={13.5}>
                    Pago fuera de término (ventana: {recargoInfo.ventana.desde} al {recargoInfo.ventana.hasta})
                  </Typography>
                </Box>
                <Typography fontSize={13} color="text.secondary">
                  Cuota ${Number(recargoInfo.precioBase).toLocaleString('es-AR')}
                  {' + '}recargo ${Number(recargoInfo.monto).toLocaleString('es-AR')}
                  {recargoInfo.tipo === 'PORCENTAJE' ? ` (${recargoInfo.valor}%)` : ''}
                  {' = '}
                  <Typography component="span" fontWeight={800} fontSize={13} color="text.primary">
                    ${Number(aplicarRecargo ? recargoInfo.total : recargoInfo.precioBase).toLocaleString('es-AR')}
                  </Typography>
                </Typography>
                <FormControlLabel
                  control={<Checkbox size="small" checked={aplicarRecargo} onChange={(e) => setAplicarRecargo(e.target.checked)} />}
                  label={<Typography fontSize={13}>Aplicar recargo</Typography>}
                  sx={{ mt: 0.5 }}
                />
              </Paper>
            )}
            {recargoInfo && !recargoInfo.aplica && recargoInfo.recargoActivo && (
              <Typography variant="caption" color="success.main" fontWeight={600}>
                ✓ Dentro de la ventana de pago (del {recargoInfo.ventana.desde} al {recargoInfo.ventana.hasta}): sin recargo
              </Typography>
            )}

            <FormControl fullWidth>
              <InputLabel>Método de pago</InputLabel>
              <Select label="Método de pago" value={form.metodoPago} onChange={e => setForm(p => ({ ...p, metodoPago: e.target.value }))}>
                {METODOS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Observaciones" value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} multiline rows={2} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={saving || !form.socio || !form.planId}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Confirmar pago'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
