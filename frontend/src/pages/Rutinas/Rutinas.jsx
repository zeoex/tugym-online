import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, CircularProgress,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tooltip, Alert, Grid, useTheme, useMediaQuery, Tabs, Tab,
} from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PlantillasTab from './PlantillasTab';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import PanelRutina, { TIPO_META } from '../../components/PanelRutina';

function buildSeccion(rutina) {
  const meta = TIPO_META[rutina.tipo];
  return [
    `--- ${meta.label.toUpperCase()}${rutina.nombre ? ': ' + rutina.nombre : ''} ---`,
    ...rutina.ejercicios.map((e, i) =>
      `${i + 1}.${e.nombre} | ${e.musculo} | ${e.series}x${e.reps} | ${e.descanso}`
    ),
  ].join('\n');
}

function buildQrCombinado(rutinas) {
  const fecha = rutinas[0]
    ? new Date(rutinas[0].fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
  return [`TuGymOnLine — Rutinas del dia (${fecha})`, '', rutinas.map(buildSeccion).join('\n\n')].join('\n');
}

export default function Rutinas() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [rutinas, setRutinas]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [editando, setEditando] = useState(null);
  const [qrData, setQrData]     = useState(null);
  const [regenerando, setRegen] = useState(null);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState(0);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rutinas/hoy');
      const mapa = {};
      data.forEach(r => { mapa[r.tipo] = r; });
      setRutinas(mapa);
    } catch { setError('Error al cargar rutinas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleRegenerar = async (id) => {
    setRegen(id);
    try {
      const { data } = await api.post(`/rutinas/${id}/regenerar`);
      setRutinas(prev => ({ ...prev, [data.tipo]: data }));
    } catch { setError('Error al regenerar'); }
    finally { setRegen(null); }
  };

  const handleGuardarEdicion = async () => {
    try {
      const { data } = await api.put(`/rutinas/${editando.id}`, { ejercicios: editando.ejercicios });
      setRutinas(prev => ({ ...prev, [data.tipo]: data }));
      setEditando(null);
    } catch { setError('Error al guardar edición'); }
  };

  const agregarEjercicio = () => {
    setEditando(prev => ({
      ...prev,
      ejercicios: [...prev.ejercicios, { nombre: '', series: 3, reps: '10-12', descanso: '60 seg', musculo: '' }],
    }));
  };

  const eliminarEjercicio = (i) => {
    setEditando(prev => ({ ...prev, ejercicios: prev.ejercicios.filter((_, idx) => idx !== i) }));
  };

  const editarCampo = (i, campo, valor) => {
    setEditando(prev => ({
      ...prev,
      ejercicios: prev.ejercicios.map((e, idx) => idx === i ? { ...e, [campo]: valor } : e),
    }));
  };

  const abrirQrHombres = () => {
    const lista = [rutinas['PRECALENTAMIENTO'], rutinas['HOMBRE']].filter(Boolean);
    setQrData({ titulo: 'QR Hombres (Precalentamiento + Rutina)', rutinas: lista });
  };

  const abrirQrMujeres = () => {
    const lista = [rutinas['PRECALENTAMIENTO'], rutinas['MUJER']].filter(Boolean);
    setQrData({ titulo: 'QR Mujeres (Precalentamiento + Rutina)', rutinas: lista });
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>;

  const precalentamiento = rutinas['PRECALENTAMIENTO'];
  const hombre           = rutinas['HOMBRE'];
  const mujer            = rutinas['MUJER'];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <FitnessCenterIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Rutinas del Día</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2.5 }}>
        <Tab icon={<TodayIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Del día" />
        <Tab icon={<LibraryBooksIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Plantillas" />
      </Tabs>

      {tab === 1 ? <PlantillasTab /> : (<>

      {/* Botones QR */}
      {(hombre || mujer) && (
        <Grid container spacing={2} mb={3}>
          {hombre && (
            <Grid item xs={12} sm={6}>
              <Paper
                onClick={abrirQrHombres}
                elevation={0}
                sx={{
                  p: 2, cursor: 'pointer', borderRadius: 2,
                  border: '2px solid #bae6fd', bgcolor: '#f0f9ff',
                  display: 'flex', alignItems: 'center', gap: 2,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: '#e0f2fe', borderColor: '#0ea5e9', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(14,165,233,0.15)' },
                }}
              >
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ManIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={700} color="#0369a1">QR Rutina Hombres</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {hombre.nombre ? `${hombre.nombre} + Precalentamiento` : 'Precalentamiento + Rutina'}
                  </Typography>
                </Box>
                <QrCode2Icon sx={{ color: '#0ea5e9', fontSize: 28, flexShrink: 0 }} />
              </Paper>
            </Grid>
          )}
          {mujer && (
            <Grid item xs={12} sm={6}>
              <Paper
                onClick={abrirQrMujeres}
                elevation={0}
                sx={{
                  p: 2, cursor: 'pointer', borderRadius: 2,
                  border: '2px solid #fbcfe8', bgcolor: '#fdf2f8',
                  display: 'flex', alignItems: 'center', gap: 2,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: '#fce7f3', borderColor: '#ec4899', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(236,72,153,0.15)' },
                }}
              >
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WomanIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={700} color="#9d174d">QR Rutina Mujeres</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {mujer.nombre ? `${mujer.nombre} + Precalentamiento` : 'Precalentamiento + Rutina'}
                  </Typography>
                </Box>
                <QrCode2Icon sx={{ color: '#ec4899', fontSize: 28, flexShrink: 0 }} />
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Precalentamiento */}
      {precalentamiento && (
        <Box mb={2}>
          <PanelRutina
            rutina={precalentamiento}
            onRegenerar={handleRegenerar}
            onEditar={r => setEditando({ ...r, ejercicios: [...r.ejercicios] })}
            onQr={null}
            regenerando={regenerando}
          />
        </Box>
      )}

      {/* Hombres | Mujeres */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <PanelRutina
            rutina={hombre}
            onRegenerar={handleRegenerar}
            onEditar={r => setEditando({ ...r, ejercicios: [...r.ejercicios] })}
            onQr={hombre ? abrirQrHombres : null}
            qrTooltip="QR Precalentamiento + Hombres"
            regenerando={regenerando}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PanelRutina
            rutina={mujer}
            onRegenerar={handleRegenerar}
            onEditar={r => setEditando({ ...r, ejercicios: [...r.ejercicios] })}
            onQr={mujer ? abrirQrMujeres : null}
            qrTooltip="QR Precalentamiento + Mujeres"
            regenerando={regenerando}
          />
        </Grid>
      </Grid>

      {/* Dialog edición */}
      {editando && (
        <Dialog open onClose={() => setEditando(null)} maxWidth="md" fullWidth fullScreen={isMobile}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FitnessCenterIcon color="primary" />
            Editar — {TIPO_META[editando.tipo]?.label}
            {editando.nombre && <Typography variant="body2" color="text.secondary" ml={1}>({editando.nombre})</Typography>}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
              {editando.ejercicios.map((e, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
                  <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                    <TextField
                      label="Ejercicio" size="small" value={e.nombre} sx={{ flex: 2, minWidth: 160 }}
                      onChange={ev => editarCampo(i, 'nombre', ev.target.value)}
                    />
                    <TextField
                      label="Músculo" size="small" value={e.musculo} sx={{ flex: 1, minWidth: 100 }}
                      onChange={ev => editarCampo(i, 'musculo', ev.target.value)}
                    />
                    <TextField
                      label="Series" size="small" type="number" value={e.series} sx={{ width: 70 }}
                      onChange={ev => editarCampo(i, 'series', parseInt(ev.target.value) || 1)}
                    />
                    <TextField
                      label="Reps" size="small" value={e.reps} sx={{ width: 90 }}
                      onChange={ev => editarCampo(i, 'reps', ev.target.value)}
                    />
                    <TextField
                      label="Descanso" size="small" value={e.descanso} sx={{ width: 100 }}
                      onChange={ev => editarCampo(i, 'descanso', ev.target.value)}
                    />
                    <IconButton size="small" color="error" onClick={() => eliminarEjercicio(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
              <Button startIcon={<AddIcon />} onClick={agregarEjercicio} variant="outlined" size="small">
                Agregar ejercicio
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditando(null)}>Cancelar</Button>
            <Button variant="contained" onClick={handleGuardarEdicion}>Guardar cambios</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Dialog QR */}
      {qrData && (
        <Dialog open onClose={() => setQrData(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode2Icon color="primary" /> {qrData.titulo}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={1}>
              <QRCodeSVG
                value={buildQrCombinado(qrData.rutinas)}
                size={isMobile ? 240 : 300}
                level="L"
                includeMargin
              />
              <Typography variant="caption" color="text.secondary" textAlign="center">
                Escaneá con la cámara del celular para ver los ejercicios del día
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={() => setQrData(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      )}
      </>)}
    </Box>
  );
}
