import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Switch, Tooltip, CircularProgress, Alert, Chip,
  useTheme, useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CampaignIcon from '@mui/icons-material/Campaign';
import api from '../../services/api';

const INIT = { titulo: '', contenido: '', fechaFin: '', activo: true };

export default function GestionAnuncios() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anuncios, setAnuncios] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const [form,     setForm]     = useState(INIT);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/anuncios');
      setAnuncios(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setForm(INIT); setEditId(null); setError(''); setOpen(true); };

  const abrirEditar = (a) => {
    setForm({
      titulo: a.titulo,
      contenido: a.contenido,
      fechaFin: a.fechaFin ? a.fechaFin.slice(0, 10) : '',
      activo: a.activo,
    });
    setEditId(a.id);
    setError('');
    setOpen(true);
  };

  const guardar = async () => {
    if (!form.titulo || !form.contenido) { setError('Título y contenido son obligatorios'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, fechaFin: form.fechaFin || null };
      if (editId) await api.put(`/anuncios/${editId}`, payload);
      else        await api.post('/anuncios', payload);
      setOpen(false);
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este anuncio?')) return;
    await api.delete(`/anuncios/${id}`);
    cargar();
  };

  const toggleActivo = async (a) => {
    await api.put(`/anuncios/${a.id}`, { activo: !a.activo });
    cargar();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <CampaignIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Anuncios</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNuevo} size={isMobile ? 'small' : 'medium'}>
          {isMobile ? 'Nuevo' : 'Nuevo anuncio'}
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
      ) : anuncios.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <CampaignIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
          <Typography>No hay anuncios. Creá el primero.</Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {anuncios.map(a => (
            <Paper
              key={a.id}
              sx={{
                p: { xs: 1.75, sm: 2 },
                opacity: a.activo ? 1 : 0.5,
                borderLeft: `4px solid`,
                borderColor: a.activo ? 'primary.main' : 'divider',
              }}
            >
              <Box display="flex" alignItems="flex-start" gap={1.5}>
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                    <Typography fontWeight={700} fontSize={15}>{a.titulo}</Typography>
                    {!a.activo && <Chip label="Inactivo" size="small" variant="outlined" />}
                    {a.fechaFin && (
                      <Chip
                        label={`Vence ${new Date(a.fechaFin).toLocaleDateString('es-AR')}`}
                        size="small"
                        color={new Date(a.fechaFin) < new Date() ? 'error' : 'default'}
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {a.contenido}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
                  <Tooltip title={a.activo ? 'Desactivar' : 'Activar'}>
                    <Switch checked={a.activo} size="small" onChange={() => toggleActivo(a)} />
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => abrirEditar(a)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" color="error" onClick={() => eliminar(a.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>{editId ? 'Editar anuncio' : 'Nuevo anuncio'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Título"
              value={form.titulo}
              onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              required fullWidth
            />
            <TextField
              label="Contenido"
              value={form.contenido}
              onChange={e => setForm(p => ({ ...p, contenido: e.target.value }))}
              required fullWidth multiline rows={4}
              helperText="Se mostrará tal como lo escribas (respeta saltos de línea)"
            />
            <TextField
              label="Fecha de vencimiento (opcional)"
              type="date"
              value={form.fechaFin}
              onChange={e => setForm(p => ({ ...p, fechaFin: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Después de esta fecha el anuncio no aparece en el portal"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Guardar cambios' : 'Publicar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
