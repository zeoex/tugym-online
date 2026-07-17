import { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Paper, Button, Fade, Divider,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarmupIcon from '@mui/icons-material/DirectionsRun';
import { ACENTO, VIOLETA } from '../../theme';
import { portalApi } from './portalApi';
import PanelRutina from '../../components/PanelRutina';

export default function PortalRutina() {
  const [rutinasDia, setRutinasDia] = useState(null); // { HOMBRE, MUJER, PRECALENTAMIENTO }
  const [cargando, setCargando] = useState(true);
  const [genero, setGenero] = useState(null);

  useEffect(() => {
    portalApi.get('/rutina-dia')
      .then((r) => setRutinasDia(r.data))
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
