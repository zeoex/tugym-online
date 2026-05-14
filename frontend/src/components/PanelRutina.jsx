import { useState } from 'react';
import {
  Box, Typography, Paper, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  IconButton, Tooltip, useTheme, useMediaQuery,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import EjercicioDemoModal from './EjercicioDemoModal';

export const TIPO_META = {
  HOMBRE:           { label: 'Hombres',         icon: <ManIcon />,           color: '#0ea5e9', bg: '#e0f2fe' },
  MUJER:            { label: 'Mujeres',          icon: <WomanIcon />,         color: '#ec4899', bg: '#fce7f3' },
  PRECALENTAMIENTO: { label: 'Precalentamiento', icon: <DirectionsRunIcon />, color: '#f59e0b', bg: '#fef3c7' },
};

export default function PanelRutina({ rutina, onRegenerar, onEditar, onQr, regenerando, qrTooltip }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [demo, setDemo] = useState(null);

  if (!rutina) return null;
  const meta = TIPO_META[rutina.tipo];

  const abrirDemo = (e) => setDemo({ nombre: e.nombre, musculo: e.musculo });

  const btnEjercicio = {
    background: 'none', border: 'none', padding: 0,
    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
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
        {rutina.editada && (
          <Chip label="Editada" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700 }} />
        )}
        {onQr && (
          <Tooltip title={qrTooltip || 'Ver QR'}>
            <IconButton size="small" onClick={() => onQr(rutina)} sx={{ color: '#fff' }}>
              <QrCode2Icon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onEditar && (
          <Tooltip title="Editar ejercicios">
            <IconButton size="small" onClick={() => onEditar(rutina)} sx={{ color: '#fff' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onRegenerar && (
          <Tooltip title="Regenerar rutina aleatoria">
            <IconButton size="small" onClick={() => onRegenerar(rutina.id)} disabled={regenerando === rutina.id} sx={{ color: '#fff' }}>
              {regenerando === rutina.id
                ? <CircularProgress size={16} sx={{ color: '#fff' }} />
                : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Mobile: lista compacta */}
      {isMobile ? (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {rutina.ejercicios.map((e, i) => (
            <Box
              key={i}
              sx={{
                px: 2, py: 1.25,
                borderBottom: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
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
                  <Chip
                    label={e.musculo}
                    size="small"
                    sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600, fontSize: 11, height: 20 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {e.series}×{e.reps} · {e.descanso}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
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
