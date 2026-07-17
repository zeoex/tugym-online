import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, IconButton, Tooltip, Alert,
  CircularProgress, useTheme, useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import api from '../../services/api';
import RutinaBuilderDialog from '../../components/RutinaBuilderDialog';

const TIPOS = [
  { valor: 'HOMBRE', label: 'Hombres', icon: <ManIcon sx={{ fontSize: 18 }} />, color: '#0ea5e9' },
  { valor: 'MUJER', label: 'Mujeres', icon: <WomanIcon sx={{ fontSize: 18 }} />, color: '#ec4899' },
  { valor: 'PRECALENTAMIENTO', label: 'Precalentamiento', icon: <DirectionsRunIcon sx={{ fontSize: 18 }} />, color: '#f59e0b' },
  { valor: 'GENERAL', label: 'Generales', icon: <FitnessCenterIcon sx={{ fontSize: 18 }} />, color: '#64748b' },
];

/* Las plantillas del gym: de acá salen la rutina del día y las asignaciones.
   Editables sin tocar código — cada gym arma las suyas. */
export default function PlantillasTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [rutinas, setRutinas] = useState(null);
  const [builder, setBuilder] = useState(null); // { rutina? }
  const [aviso, setAviso] = useState('');

  const cargar = () => api.get('/rutinas-biblioteca').then((r) => setRutinas(r.data)).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const eliminar = async (rutina) => {
    if (!window.confirm(`¿Eliminar la plantilla "${rutina.nombre}"?`)) return;
    const { data } = await api.delete(`/rutinas-biblioteca/${rutina.id}`);
    setAviso(data.mensaje);
    setTimeout(() => setAviso(''), 4000);
    cargar();
  };

  if (!rutinas) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="body2" color="text.secondary">
          La rutina del día se sortea entre estas plantillas. También podés asignarlas a socios desde su ficha.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBuilder({})} sx={{ flexShrink: 0 }}>
          {isMobile ? 'Nueva' : 'Nueva plantilla'}
        </Button>
      </Box>

      {aviso && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAviso('')}>{aviso}</Alert>}

      {TIPOS.map(({ valor, label, icon, color }) => {
        const deTipo = rutinas.filter((r) => r.tipo === valor);
        if (!deTipo.length) return null;
        return (
          <Box key={valor} mb={2.5}>
            <Box display="flex" alignItems="center" gap={0.75} mb={1}>
              <Box sx={{ color, display: 'flex' }}>{icon}</Box>
              <Typography fontWeight={700} fontSize={14}>{label}</Typography>
              <Typography variant="caption" color="text.secondary">({deTipo.length})</Typography>
            </Box>
            <Paper>
              {deTipo.map((r, i) => (
                <Box key={r.id} sx={{
                  px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5,
                  borderBottom: i < deTipo.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
                }}>
                  <Box flex={1} minWidth={0}>
                    <Typography fontWeight={600} fontSize={14} noWrap>{r.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {r.items.slice(0, 3).map((it) => it.nombre).join(' · ')}{r.items.length > 3 ? ` · +${r.items.length - 3}` : ''}
                    </Typography>
                  </Box>
                  <Chip label={`${r.items.length} ej.`} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                  <Tooltip title="Editar"><IconButton size="small" onClick={() => setBuilder({ rutina: r })}><EditIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                  <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => eliminar(r)}><DeleteOutlineIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                </Box>
              ))}
            </Paper>
          </Box>
        );
      })}

      <RutinaBuilderDialog
        abierta={Boolean(builder)}
        rutina={builder?.rutina || null}
        esPlantilla
        onCerrar={() => setBuilder(null)}
        onGuardada={cargar}
      />
    </Box>
  );
}
