import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tooltip, Alert, Grid, useTheme, useMediaQuery,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import EjercicioDemoModal from '../../components/EjercicioDemoModal';

const TIPO_META = {
  HOMBRE:           { label: 'Hombres',         icon: <ManIcon />,           color: '#0ea5e9', bg: '#e0f2fe' },
  MUJER:            { label: 'Mujeres',          icon: <WomanIcon />,         color: '#ec4899', bg: '#fce7f3' },
  PRECALENTAMIENTO: { label: 'Precalentamiento', icon: <DirectionsRunIcon />, color: '#f59e0b', bg: '#fef3c7' },
};

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

function PanelRutina({ rutina, onRegenerar, onEditar, onQr, regenerando, qrTooltip }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [demo, setDemo] = useState(null);

  if (!rutina) return null;
  const meta = TIPO_META[rutina.tipo];

  const abrirDemo = (e) => setDemo({ nombre: e.nombre, musculo: e.musculo });

  const btnEjercicio = {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  };

  return (
    <Paper sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: meta.color, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>{meta.icon}</Box>
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight={700} color="#fff" lineHeight={1.1}>
            {meta.label}
          </Typography>
          {rutina.nombre && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              {rutina.nombre}
            </Typography>
          )}
        </Box>
        {rutina.editada && <Chip label="Editada" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700 }} />}
        {onQr && (
          <Tooltip title={qrTooltip || 'Ver QR'}>
            <IconButton size="small" onClick={() => onQr(rutina)} sx={{ color: '#fff' }}>
              <QrCode2Icon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Editar ejercicios">
          <IconButton size="small" onClick={() => onEditar(rutina)} sx={{ color: '#fff' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Regenerar rutina aleatoria">
          <IconButton size="small" onClick={() => onRegenerar(rutina.id)} disabled={regenerando === rutina.id} sx={{ color: '#fff' }}>
            {regenerando === rutina.id ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <RefreshIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Mobile: lista compacta */}
      {isMobile ? (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {rutina.ejercicios.map((e, i) => (
            <Box
              key={i}
              sx={{
                px: 2, py: 1.25,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
              }}
            >
              <Typography sx={{ color: 'text.disabled', fontSize: 12, width: 18, flexShrink: 0, mt: 0.4 }}>
                {i + 1}
              </Typography>
              <Box flex={1} minWidth={0}>
                <Tooltip title="Ver cómo se hace" placement="top">
                  <Typography
                    component="button"
                    onClick={() => abrirDemo(e)}
                    fontWeight={600}
                    fontSize={13}
                    noWrap
                    sx={{
                      ...btnEjercicio,
                      color: meta.color,
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                      textUnderlineOffset: 3,
                      '&:hover': { opacity: 0.75 },
                    }}
                  >
                    {e.nombre}
                  </Typography>
                </Tooltip>
                <Box display="flex" alignItems="center" gap={1} mt={0.3} flexWrap="wrap">
                  <Chip label={e.musculo} size="small" sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600, fontSize: 11, height: 20 }} />
                  <Typography variant="caption" color="text.secondary">
                    {e.series}×{e.reps} · {e.descanso}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        /* Desktop: tabla */
        <TableContainer sx={{ flex: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: meta.bg }}>
                <TableCell sx={{ color: meta.color, fontWeight: 700, width: 28 }}>#</TableCell>
                <TableCell sx={{ color: meta.color, fontWeight: 700 }}>Ejercicio</TableCell>
                <TableCell sx={{ color: meta.color, fontWeight: 700 }}>Músculo</TableCell>
                <TableCell sx={{ color: meta.color, fontWeight: 700, width: 52 }}>Ser.</TableCell>
                <TableCell sx={{ color: meta.color, fontWeight: 700, width: 72 }}>Reps</TableCell>
                <TableCell sx={{ color: meta.color, fontWeight: 700, width: 84 }}>Descanso</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rutina.ejercicios.map((e, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ color: 'text.disabled' }}>{i + 1}</TableCell>
                  <TableCell>
                    <Tooltip title="Ver cómo se hace" placement="right">
                      <Typography
                        component="button"
                        onClick={() => abrirDemo(e)}
                        fontWeight={500}
                        fontSize={13}
                        sx={{
                          ...btnEjercicio,
                          color: meta.color,
                          textDecoration: 'underline',
                          textDecorationStyle: 'dotted',
                          textUnderlineOffset: 3,
                          '&:hover': { opacity: 0.75 },
                        }}
                      >
                        {e.nombre}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip label={e.musculo} size="small" sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600, fontSize: 11 }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{e.series}</TableCell>
                  <TableCell>{e.reps}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{e.descanso}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal demo */}
      {demo && (
        <EjercicioDemoModal
          open
          nombre={demo.nombre}
          musculo={demo.musculo}
          metaColor={meta.color}
          metaBg={meta.bg}
          onClose={() => setDemo(null)}
        />
      )}
    </Paper>
  );
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
    </Box>
  );
}
