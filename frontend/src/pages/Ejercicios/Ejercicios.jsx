import { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Alert,
  CircularProgress, Table, TableHead, TableBody, TableRow, TableCell,
  InputAdornment, useTheme, useMediaQuery,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import MovieIcon from '@mui/icons-material/Movie';
import api from '../../services/api';
import { ACENTO, INK } from '../../theme';

const FORM_INIT = { nombre: '', musculo: '', mediaKey: null };

export default function Ejercicios() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [ejercicios, setEjercicios] = useState(null);
  const [q, setQ] = useState('');
  const [dialog, setDialog] = useState(null); // { ejercicio? } — null cerrado, {} nuevo
  const [form, setForm] = useState(FORM_INIT);
  const [animSel, setAnimSel] = useState(null);
  const [opcionesAnim, setOpcionesAnim] = useState([]);
  const [buscandoAnim, setBuscandoAnim] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');
  const timerRef = useRef(null);

  const cargar = () => api.get('/ejercicios').then((r) => setEjercicios(r.data)).catch(() => {});
  useEffect(() => { cargar(); }, []);

  // Buscador del catálogo del dataset (1.324 animaciones) con debounce
  const buscarAnim = (texto) => {
    clearTimeout(timerRef.current);
    if (!texto || texto.length < 2) { setOpcionesAnim([]); return; }
    timerRef.current = setTimeout(async () => {
      setBuscandoAnim(true);
      try {
        const { data } = await api.get('/ejercicios/catalogo', { params: { q: texto } });
        setOpcionesAnim(data);
      } finally {
        setBuscandoAnim(false);
      }
    }, 350);
  };

  const abrir = (ejercicio = null) => {
    setError('');
    if (ejercicio) {
      setForm({ nombre: ejercicio.nombre, musculo: ejercicio.musculo || '', mediaKey: ejercicio.mediaKey });
      setAnimSel(ejercicio.mediaKey
        ? { key: ejercicio.mediaKey, nombreEn: ejercicio.media?.nombreEn || ejercicio.mediaKey, gifPreview: ejercicio.media?.gif }
        : null);
    } else {
      setForm(FORM_INIT);
      setAnimSel(null);
    }
    setOpcionesAnim([]);
    setDialog({ ejercicio });
  };

  const guardar = async () => {
    setError('');
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setGuardando(true);
    try {
      const payload = { nombre: form.nombre, musculo: form.musculo || null, mediaKey: animSel?.key || null };
      if (dialog.ejercicio) await api.put(`/ejercicios/${dialog.ejercicio.id}`, payload);
      else await api.post('/ejercicios', payload);
      setDialog(null);
      cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (ejercicio) => {
    if (!window.confirm(`¿Eliminar "${ejercicio.nombre}"?`)) return;
    const { data } = await api.delete(`/ejercicios/${ejercicio.id}`);
    setAviso(data.mensaje);
    setTimeout(() => setAviso(''), 4000);
    cargar();
  };

  const filtrados = ejercicios?.filter((e) =>
    !q || e.nombre.toLowerCase().includes(q.toLowerCase()) || (e.musculo || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5} gap={2} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="h4" fontSize={26}>Ejercicios</Typography>
          {ejercicios && <Chip label={ejercicios.length} size="small" sx={{ fontWeight: 700 }} />}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrir()}>
          {isMobile ? 'Nuevo' : 'Nuevo ejercicio'}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        La biblioteca del gym. Renombrá tranquilo: la animación queda vinculada por ID, no por nombre.
      </Typography>

      {aviso && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAviso('')}>{aviso}</Alert>}

      <TextField
        placeholder="Buscar por nombre o músculo…"
        value={q} onChange={(e) => setQ(e.target.value)}
        fullWidth sx={{ mb: 2, maxWidth: 420 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 19 }} /></InputAdornment> }}
      />

      {!filtrados ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ejercicio</TableCell>
                {!isMobile && <TableCell>Músculo</TableCell>}
                <TableCell>Animación</TableCell>
                {!isMobile && <TableCell align="center">En rutinas</TableCell>}
                <TableCell align="right" width={96} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell sx={{ fontWeight: 600, fontSize: 13.5 }}>
                    {e.nombre}
                    {isMobile && e.musculo && (
                      <Typography variant="caption" display="block" color="text.secondary">{e.musculo}</Typography>
                    )}
                  </TableCell>
                  {!isMobile && <TableCell><Typography variant="body2" color="text.secondary">{e.musculo || '—'}</Typography></TableCell>}
                  <TableCell>
                    {e.media?.gif ? (
                      <Chip icon={<MovieIcon sx={{ fontSize: 14 }} />} label={isMobile ? 'GIF' : 'Animado'} size="small"
                        sx={{ bgcolor: ACENTO, color: INK, fontWeight: 700, fontSize: 11, '& .MuiChip-icon': { color: INK } }} />
                    ) : e.mediaKey ? (
                      <Chip label="Pendiente" size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
                    ) : (
                      <Chip label="Sin animación" size="small" variant="outlined" sx={{ fontSize: 11, color: 'text.disabled' }} />
                    )}
                  </TableCell>
                  {!isMobile && <TableCell align="center"><Typography variant="body2" color="text.secondary">{e.usos}</Typography></TableCell>}
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => abrir(e)}><EditIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => eliminar(e)}><DeleteOutlineIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Crear / editar */}
      <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FitnessCenterIcon color="primary" /> {dialog?.ejercicio ? 'Editar ejercicio' : 'Nuevo ejercicio'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2.5} mt={1}>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            <TextField label="Nombre" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} fullWidth autoFocus />
            <TextField label="Músculo" value={form.musculo} onChange={(e) => setForm((p) => ({ ...p, musculo: e.target.value }))}
              placeholder="Pecho, Glúteos, Core…" fullWidth />

            <Autocomplete
              options={opcionesAnim}
              value={animSel}
              onChange={(_e, v) => setAnimSel(v)}
              onInputChange={(_e, texto, motivo) => { if (motivo === 'input') buscarAnim(texto); }}
              getOptionLabel={(o) => o.nombreEn || ''}
              isOptionEqualToValue={(a, b) => a.key === b.key}
              filterOptions={(x) => x}
              loading={buscandoAnim}
              noOptionsText="Escribí en inglés: bench press, squat, curl…"
              renderOption={(props, o) => (
                <li {...props} key={o.key}>
                  <Box display="flex" alignItems="center" gap={1.5} width="100%">
                    <Box component="img" src={o.gifPreview} alt="" loading="lazy"
                      sx={{ width: 54, height: 54, objectFit: 'contain', borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }} />
                    <Box minWidth={0}>
                      <Typography fontSize={13.5} fontWeight={600} noWrap>{o.nombreEn}</Typography>
                      <Typography variant="caption" color="text.secondary">{o.musculo} · {o.equipo}</Typography>
                    </Box>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Animación (catálogo de 1.324)"
                  helperText="Buscá en inglés y elegí el GIF. Se descarga solo la primera vez."
                  InputProps={{ ...params.InputProps, endAdornment: (<>{buscandoAnim ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>) }} />
              )}
            />

            {animSel?.gifPreview && (
              <Box component="img" src={animSel.gifPreview} alt={animSel.nombreEn}
                sx={{ maxHeight: 200, objectFit: 'contain', borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider', alignSelf: 'center' }} />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
