import { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Paper, Button, Fade, Divider, Chip,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarmupIcon from '@mui/icons-material/DirectionsRun';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { ACENTO, VIOLETA, INK } from '../../theme';
import { portalApi, dniGuardado } from './portalApi';
import PanelRutina from '../../components/PanelRutina';
import EjercicioDemoModal from '../../components/EjercicioDemoModal';

/* La rutina que el coach le armó/asignó a ESTE socio, con sus animaciones. */
function MiRutina({ rutina }) {
  const [demo, setDemo] = useState(null);
  return (
    <Box mb={3}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <StarIcon sx={{ color: ACENTO, fontSize: 20 }} />
        <Typography fontWeight={700} fontSize={15}>Tu rutina — {rutina.nombre}</Typography>
        {rutina.personalizada && (
          <Chip label="Personalizada" size="small" sx={{ ml: 'auto', bgcolor: ACENTO, color: INK, fontWeight: 800, fontSize: 10.5 }} />
        )}
      </Box>
      <Paper sx={{ overflow: 'hidden' }}>
        {rutina.ejercicios.map((e, i) => (
          <Box key={i} sx={{
            px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5,
            borderBottom: i < rutina.ejercicios.length - 1 ? '1px solid rgba(242,245,234,0.07)' : 'none',
          }}>
            <Typography sx={{ color: 'text.disabled', fontSize: 12, width: 18 }}>{i + 1}</Typography>
            <Box flex={1} minWidth={0}>
              <Typography fontWeight={600} fontSize={13.5} noWrap>{e.nombre}</Typography>
              <Typography variant="caption" color="text.secondary">
                {e.musculo ? `${e.musculo} · ` : ''}{e.series}×{e.reps} · {e.descanso}
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => setDemo(e)}
              startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
              sx={{ color: ACENTO, flexShrink: 0, minWidth: 0 }}
            >
              Ver
            </Button>
          </Box>
        ))}
      </Paper>
      {demo && (
        <EjercicioDemoModal
          open
          nombre={demo.nombre}
          musculo={demo.musculo}
          media={demo.media}
          onClose={() => setDemo(null)}
        />
      )}
    </Box>
  );
}

export default function PortalRutina() {
  const [rutinasDia, setRutinasDia] = useState(null); // { HOMBRE, MUJER, PRECALENTAMIENTO }
  const [miRutina, setMiRutina] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [genero, setGenero] = useState(null);

  useEffect(() => {
    const pedidos = [portalApi.get('/rutina-dia')];
    const dni = dniGuardado.get();
    if (dni) pedidos.push(portalApi.get(`/mi-rutina/${encodeURIComponent(dni)}`));
    Promise.allSettled(pedidos)
      .then(([dia, mia]) => {
        if (dia.status === 'fulfilled') setRutinasDia(dia.value.data);
        if (mia?.status === 'fulfilled') setMiRutina(mia.value.data.rutina);
      })
      .finally(() => setCargando(false));
  }, []);

  const rutinaGenero = genero ? rutinasDia?.[genero] : null;
  const precalenta   = genero ? rutinasDia?.PRECALENTAMIENTO : null;

  if (cargando) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  if (!genero) {
    return (
      <Fade in>
        <Box>
        {miRutina && <MiRutina rutina={miRutina} />}
        <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          <FitnessCenterIcon sx={{ color: ACENTO, fontSize: 40, mb: 1.5 }} />
          <Typography variant="h6" fontSize={18} mb={0.5}>
            ¿Cuál es tu rutina de hoy?
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Incluye precalentamiento + rutina del día
          </Typography>

          <Box display="flex" gap={1.5} justifyContent="center">
            {[
              { key: 'HOMBRE', label: 'Varón', icon: <ManIcon sx={{ fontSize: 26 }} />, color: ACENTO },
              { key: 'MUJER',  label: 'Mujer', icon: <WomanIcon sx={{ fontSize: 26 }} />, color: VIOLETA },
            ].map((g) => (
              <Box
                key={g.key}
                onClick={() => setGenero(g.key)}
                sx={{
                  flex: 1, maxWidth: 220, height: 62, px: 3,
                  borderRadius: 3,
                  border: `1.5px solid ${g.color}55`,
                  background: `linear-gradient(110deg, ${g.color}10 0%, ${g.color}22 100%)`,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                  transition: 'all 0.15s',
                  '&:hover': {
                    borderColor: `${g.color}bb`,
                    boxShadow: `0 6px 24px ${g.color}30`,
                    transform: 'translateY(-2px)',
                  },
                  '&:active': { transform: 'translateY(0)', boxShadow: 'none' },
                }}
              >
                <Box sx={{ color: g.color, display: 'flex', alignItems: 'center' }}>{g.icon}</Box>
                <Typography fontWeight={700} fontSize={17}>{g.label}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in>
      <Box>
        <Button
          onClick={() => setGenero(null)}
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={{ color: 'text.secondary', mb: 2 }}
        >
          Elegir de nuevo
        </Button>

        {precalenta && (
          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <WarmupIcon sx={{ color: '#FBBF24', fontSize: 20 }} />
              <Typography fontWeight={700} fontSize={15}>
                Precalentamiento — {precalenta.nombre}
              </Typography>
            </Box>
            <Box sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(242,245,234,0.08)' }}>
              <PanelRutina rutina={precalenta} />
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {rutinaGenero && (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <FitnessCenterIcon sx={{ color: ACENTO, fontSize: 20 }} />
              <Typography fontWeight={700} fontSize={15}>
                Rutina del día — {rutinaGenero.nombre}
              </Typography>
              <Box sx={{ ml: 'auto', px: 1.5, py: 0.4, borderRadius: 10, bgcolor: 'rgba(200,241,63,0.12)' }}>
                <Typography fontSize={12} fontWeight={700} sx={{ color: ACENTO }}>
                  {genero === 'HOMBRE' ? 'Varones' : 'Mujeres'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(242,245,234,0.08)' }}>
              <PanelRutina rutina={rutinaGenero} />
            </Box>
          </Box>
        )}
      </Box>
    </Fade>
  );
}
