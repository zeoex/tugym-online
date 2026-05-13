import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, CircularProgress, Alert, Switch,
  FormControlLabel, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import StyleIcon from '@mui/icons-material/Style';
import api from '../../services/api';

const TIPOS = ['DIARIO', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'PERSONALIZADO'];
const INIT  = { nombre: '', tipo: 'MENSUAL', duracionDias: 30, precio: '', descripcion: '', activo: true };

export default function GestionPlanes() {
  const [planes, setPlanes]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState(INIT);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const cargar = async () => {
    setLoading(true);
    try { const { data } = await api.get('/planes'); setPlanes(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setForm(INIT); setEditId(null); setError(''); setOpen(true);
  };

  const abrirEditar = (plan) => {
    setForm({
      nombre:      plan.nombre,
      tipo:        plan.tipo,
      duracionDias:plan.duracionDias,
      precio:      plan.precio,
      descripcion: plan.descripcion || '',
      activo:      plan.activo,
    });
    setEditId(plan.id); setError(''); setOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const guardar = async () => {
    if (!form.nombre || !form.precio || !form.duracionDias) {
      setError('Nombre, precio y días son obligatorios'); return;
    }
    setError(''); setSaving(true);
    try {
      const payload = { ...form, precio: parseFloat(form.precio), duracionDias: parseInt(form.duracionDias) };
      if (editId) await api.put(`/planes/${editId}`, payload);
      else        await api.post('/planes', payload);
      setOpen(false); cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const toggleActivo = async (plan) => {
    await api.put(`/planes/${plan.id}`, { ...plan, activo: !plan.activo });
    cargar();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <StyleIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Planes de pago</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNuevo}>Nuevo plan</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {['Nombre', 'Tipo', 'Duración', 'Precio', 'Descripción', 'Estado', ''].map(h => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={28} sx={{ my: 2 }} /></TableCell></TableRow>
            ) : planes.map(p => (
              <TableRow key={p.id} hover sx={{ opacity: p.activo ? 1 : 0.5 }}>
                <TableCell><Typography fontWeight={600}>{p.nombre}</Typography></TableCell>
                <TableCell><Chip label={p.tipo} size="small" variant="outlined" /></TableCell>
                <TableCell>{p.duracionDias} día{p.duracionDias !== 1 ? 's' : ''}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                  ${Number(p.precio).toLocaleString('es-AR')}
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{p.descripcion || '-'}</TableCell>
                <TableCell>
                  <Tooltip title={p.activo ? 'Desactivar' : 'Activar'}>
                    <Switch checked={p.activo} size="small" onChange={() => toggleActivo(p)} />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => abrirEditar(p)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIALOG CREAR / EDITAR */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Editar plan' : 'Nuevo plan'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Nombre del plan" name="nombre"
              value={form.nombre} onChange={handleChange} required fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>Tipo</InputLabel>
              <Select label="Tipo" name="tipo" value={form.tipo} onChange={handleChange}>
                {TIPOS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Duración (días)" name="duracionDias" type="number"
              value={form.duracionDias} onChange={handleChange}
              required fullWidth inputProps={{ min: 1 }}
              helperText="Cantidad de días que dura el plan"
            />

            <TextField
              label="Precio ($)" name="precio" type="number"
              value={form.precio} onChange={handleChange}
              required fullWidth inputProps={{ min: 0, step: '0.01' }}
              helperText="Monto a cobrar por este plan"
            />

            <TextField
              label="Descripción (opcional)" name="descripcion"
              value={form.descripcion} onChange={handleChange}
              fullWidth multiline rows={2}
            />

            {editId && (
              <FormControlLabel
                control={<Switch name="activo" checked={form.activo} onChange={handleChange} />}
                label="Plan activo"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Guardar cambios' : 'Crear plan')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
