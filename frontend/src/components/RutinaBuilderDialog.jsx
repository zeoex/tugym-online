import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Box, Typography, IconButton, Autocomplete, Select, MenuItem, FormControl,
  InputLabel, Alert, CircularProgress, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import api from '../services/api';

const ITEM_NUEVO = { ejercicioId: null, series: 3, reps: '10-12', descanso: '60 seg' };

/* Arma o edita una rutina: plantilla del gym (socioId null) o personal de un socio.
   Los items referencian ejercicioId — renombrar un ejercicio nunca rompe la rutina. */
export default function RutinaBuilderDialog({ abierta, onCerrar, onGuardada, rutina, socioId, esPlantilla }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [ejercicios, setEjercicios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('GENERAL');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    api.get('/ejercicios').then((r) => setEjercicios(r.data)).catch(() => {});
    setError('');
    if (rutina) {
      setNombre(rutina.nombre);
      setTipo(rutina.tipo || 'GENERAL');
      setItems(rutina.items.map((it) => ({
        ejercicioId: it.ejercicioId, series: it.series, reps: it.reps, descanso: it.descanso,
      })));
    } else {
      setNombre('');
      setTipo(esPlantilla ? 'HOMBRE' : 'GENERAL');
      setItems([{ ...ITEM_NUEVO }]);
    }
  }, [abierta, rutina, esPlantilla]);

  // En plantillas de precalentamiento, los ejercicios de calentamiento van primero
  const opcionesOrdenadas = [...ejercicios].sort((a, b) => {
    if (tipo === 'PRECALENTAMIENTO') {
      const pa = a.categoria === 'CALENTAMIENTO' ? 0 : 1;
      const pb = b.categoria === 'CALENTAMIENTO' ? 0 : 1;
      if (pa !== pb) return pa - pb;
    }
    return a.nombre.localeCompare(b.nombre);
  });

  const setItem = (i, campo, valor) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)));
  };
  const mover = (i, dir) => {
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  };

  const guardar = async () => {
    setError('');
    if (!nombre.trim()) { setError('Poné un nombre a la rutina'); return; }
    const validos = items.filter((it) => it.ejercicioId);
    if (!validos.length) { setError('Agregá al menos un ejercicio'); return; }
    setGuardando(true);
    try {
      const payload = { nombre: nombre.trim(), tipo, items: validos, ...(socioId ? { socioId } : {}) };
      const { data } = rutina
        ? await api.put(`/rutinas-biblioteca/${rutina.id}`, payload)
        : await api.post('/rutinas-biblioteca', payload);
      onGuardada?.(data);
      onCerrar();
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo guardar la rutina');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierta} onClose={onCerrar} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FitnessCenterIcon color="primary" />
        {rutina ? 'Editar rutina' : socioId ? 'Nueva rutina personal' : 'Nueva plantilla'}
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Nombre de la rutina" value={nombre} onChange={(e) => setNombre(e.target.value)}
              sx={{ flex: 2, minWidth: 220 }} placeholder="Ej: Fuerza total — Semana A"
            />
            {esPlantilla && (
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Tipo</InputLabel>
                <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <MenuItem value="HOMBRE">Hombres</MenuItem>
                  <MenuItem value="MUJER">Mujeres</MenuItem>
                  <MenuItem value="PRECALENTAMIENTO">Precalentamiento</MenuItem>
                  <MenuItem value="GENERAL">General</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>

          <Typography fontWeight={700} fontSize={14}>Ejercicios</Typography>

          {items.map((it, i) => {
            const elegido = ejercicios.find((e) => e.id === it.ejercicioId) || null;
            return (
              <Box key={i} display="flex" gap={1} alignItems="center" flexWrap="wrap"
                sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(18,22,13,0.03)' }}>
                <Typography sx={{ color: 'text.disabled', width: 20, fontSize: 13, fontWeight: 700 }}>{i + 1}</Typography>
                <Autocomplete
                  options={opcionesOrdenadas}
                  value={elegido}
                  onChange={(_e, v) => setItem(i, 'ejercicioId', v?.id ?? null)}
                  getOptionLabel={(e) => e.nombre}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderOption={(props, e) => (
                    <li {...props} key={e.id}>
                      <Box display="flex" alignItems="center" gap={1} width="100%">
                        <Typography flex={1} fontSize={14} noWrap>{e.nombre}</Typography>
                        {e.categoria === 'CALENTAMIENTO' && (
                          <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, flexShrink: 0 }}>calent.</Typography>
                        )}
                        {e.media?.gif && <FitnessCenterIcon sx={{ fontSize: 14, color: 'success.main', flexShrink: 0 }} />}
                        <Typography variant="caption" color="text.secondary" flexShrink={0}>{e.musculo}</Typography>
                      </Box>
                    </li>
                  )}
                  sx={{ flex: 1, minWidth: 220 }}
                  renderInput={(params) => <TextField {...params} placeholder="Buscar ejercicio…" />}
                />
                <TextField label="Series" type="number" value={it.series}
                  onChange={(e) => setItem(i, 'series', parseInt(e.target.value || 1, 10))}
                  inputProps={{ min: 1, max: 20 }} sx={{ width: 78 }} />
                <TextField label="Reps" value={it.reps}
                  onChange={(e) => setItem(i, 'reps', e.target.value)} sx={{ width: 100 }} />
                <TextField label="Descanso" value={it.descanso}
                  onChange={(e) => setItem(i, 'descanso', e.target.value)} sx={{ width: 100 }} />
                <Box display="flex">
                  <IconButton size="small" onClick={() => mover(i, -1)} disabled={i === 0}><ArrowUpwardIcon sx={{ fontSize: 17 }} /></IconButton>
                  <IconButton size="small" onClick={() => mover(i, 1)} disabled={i === items.length - 1}><ArrowDownwardIcon sx={{ fontSize: 17 }} /></IconButton>
                  <Tooltip title="Quitar">
                    <IconButton size="small" color="error" onClick={() => setItems((prev) => prev.filter((_x, idx) => idx !== i))}>
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}

          <Button startIcon={<AddIcon />} onClick={() => setItems((prev) => [...prev, { ...ITEM_NUEVO }])} sx={{ alignSelf: 'flex-start' }}>
            Agregar ejercicio
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>
          {guardando ? <CircularProgress size={20} color="inherit" /> : 'Guardar rutina'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
