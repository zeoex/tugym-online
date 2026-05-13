import { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress, Autocomplete, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import api from '../../services/api';

const METODOS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'];
const ESTADO_COLOR = { ACTIVO: 'success', VENCIDO: 'error', CANCELADO: 'default' };

export default function GestionPagos() {
  const [pagos, setPagos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [planes, setPlanes] = useState([]);
  const [socios, setSocios] = useState([]);
  const [form, setForm] = useState({ socio: null, planId: '', metodoPago: 'EFECTIVO', observaciones: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
      await api.post('/pagos', { socioId: form.socio?.id, planId: form.planId, metodoPago: form.metodoPago, observaciones: form.observaciones });
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
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>({total})</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirDialog}>Registrar pago</Button>
      </Box>

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
                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>${Number(p.monto).toLocaleString('es-AR')}</TableCell>
                <TableCell>{new Date(p.fechaPago).toLocaleDateString('es-AR')}</TableCell>
                <TableCell>{new Date(p.fechaVencimiento).toLocaleDateString('es-AR')}</TableCell>
                <TableCell>{p.metodoPago}</TableCell>
                <TableCell><Chip label={p.estado} color={ESTADO_COLOR[p.estado]} size="small" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
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
                {planes.map(pl => <MenuItem key={pl.id} value={pl.id}>{pl.nombre} — ${Number(pl.precio).toLocaleString('es-AR')} ({pl.duracionDias} días)</MenuItem>)}
              </Select>
            </FormControl>
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
