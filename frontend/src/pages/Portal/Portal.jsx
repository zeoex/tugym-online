import { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Paper,
  useTheme, useMediaQuery, Button, Fade, Divider,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CampaignIcon from '@mui/icons-material/Campaign';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarmupIcon from '@mui/icons-material/DirectionsRun';
import axios from 'axios';
import PanelRutina from '../../components/PanelRutina';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const pub = axios.create({ baseURL: BASE });

const ACCENT = '#06b6d4';

export default function Portal() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anuncios,   setAnuncios]   = useState([]);
  const [rutinasDia, setRutinasDia] = useState(null); // { HOMBRE, MUJER, PRECALENTAMIENTO }
  const [loadInit,   setLoadInit]   = useState(true);
  const [genero,     setGenero]     = useState(null);  // 'HOMBRE' | 'MUJER'

  useEffect(() => {
    Promise.all([
      pub.get('/portal/anuncios'),
      pub.get('/portal/rutina-dia'),
    ]).then(([a, r]) => {
      setAnuncios(a.data);
      setRutinasDia(r.data);
    }).finally(() => setLoadInit(false));
  }, []);

  const rutinaGenero = genero ? rutinasDia?.[genero]        : null;
  const precalenta   = genero ? rutinasDia?.PRECALENTAMIENTO : null;

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f172a 0%, #111827 60%, #0c1a2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pb: 6,
    }}>

      {/* Header */}
      <Box sx={{
        width: '100%',
        px: { xs: 2, sm: 4 },
        py: { xs: 2, sm: 2.5 },
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'rgba(15,23,42,0.9)',
        backdropFilter: 'blur(8px)',
      }}>
        {genero && (
          <Button
            onClick={() => setGenero(null)}
            size="small"
            startIcon={<ArrowBackIcon />}
            sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 0, mr: 0.5 }}
          >
            {!isMobile && 'Volver'}
          </Button>
        )}
        <Box sx={{
          width: 34, height: 34, borderRadius: 1.5,
          bgcolor: ACCENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 16px rgba(6,182,212,0.4)`,
        }}>
          <FitnessCenterIcon sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        <Box>
          <Typography fontWeight={800} color="#fff" fontSize={15} lineHeight={1.1} letterSpacing="-0.3px">
            TuGymOnLine
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
            Rutina del día
          </Typography>
        </Box>
      </Box>

      {/* Cuerpo */}
      <Box sx={{ width: '100%', maxWidth: 720, px: { xs: 2, sm: 3 }, mt: { xs: 3, sm: 4 } }}>

        {/* Anuncios — siempre visibles */}
        {!loadInit && anuncios.length > 0 && (
          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <CampaignIcon sx={{ color: ACCENT, fontSize: 20 }} />
              <Typography fontWeight={700} color="#fff" fontSize={15}>Anuncios del gym</Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={1.5}>
              {anuncios.map(a => (
                <Paper key={a.id} sx={{
                  p: { xs: 1.75, sm: 2 },
                  borderRadius: 2.5,
                  bgcolor: 'rgba(6,182,212,0.08)',
                  border: '1px solid rgba(6,182,212,0.25)',
                }}>
                  <Typography fontWeight={700} color="#fff" fontSize={14} mb={0.5}>{a.titulo}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                    {a.contenido}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {loadInit ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress sx={{ color: ACCENT }} />
          </Box>
        ) : !genero ? (
          /* PASO 1 — Elegir género */
          <Fade in>
            <Paper sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
            }}>
              <FitnessCenterIcon sx={{ color: ACCENT, fontSize: 40, mb: 1.5 }} />
              <Typography fontWeight={700} color="#fff" fontSize={18} mb={0.5}>
                ¿Cuál es tu rutina de hoy?
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 3 }}>
                Incluye precalentamiento + rutina del día
              </Typography>

              <Box display="flex" gap={2} justifyContent="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                {[
                  { key: 'HOMBRE', label: 'Varón',  icon: <ManIcon  sx={{ fontSize: 44 }} /> },
                  { key: 'MUJER',  label: 'Mujer',  icon: <WomanIcon sx={{ fontSize: 44 }} /> },
                ].map(g => (
                  <Box
                    key={g.key}
                    onClick={() => setGenero(g.key)}
                    sx={{
                      flex: 1, maxWidth: 220, mx: 'auto',
                      p: { xs: 2.5, sm: 3.5 },
                      borderRadius: 3,
                      border: '2px solid rgba(6,182,212,0.3)',
                      bgcolor: 'rgba(6,182,212,0.06)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                      transition: 'all 0.18s',
                      '&:hover': {
                        border: `2px solid ${ACCENT}`,
                        bgcolor: 'rgba(6,182,212,0.14)',
                        transform: 'translateY(-3px)',
                        boxShadow: `0 10px 28px rgba(6,182,212,0.22)`,
                      },
                      '&:active': { transform: 'translateY(0)' },
                    }}
                  >
                    <Box sx={{ color: ACCENT }}>{g.icon}</Box>
                    <Typography fontWeight={700} color="#fff" fontSize={18}>{g.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Fade>
        ) : (
          /* PASO 2 — Rutinas del día */
          <Fade in>
            <Box>
              {/* Precalentamiento */}
              {precalenta && (
                <Box mb={3}>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <WarmupIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                    <Typography fontWeight={700} color="#fff" fontSize={15}>
                      Precalentamiento — {precalenta.nombre}
                    </Typography>
                  </Box>
                  <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <PanelRutina rutina={precalenta} />
                  </Box>
                </Box>
              )}

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 3 }} />

              {/* Rutina del día */}
              {rutinaGenero && (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <FitnessCenterIcon sx={{ color: ACCENT, fontSize: 20 }} />
                    <Typography fontWeight={700} color="#fff" fontSize={15}>
                      Rutina del día — {rutinaGenero.nombre}
                    </Typography>
                    <Box sx={{
                      ml: 'auto', px: 1.5, py: 0.4, borderRadius: 10,
                      bgcolor: 'rgba(6,182,212,0.15)',
                    }}>
                      <Typography fontSize={12} fontWeight={600} color={ACCENT}>
                        {genero === 'HOMBRE' ? 'Varones' : 'Mujeres'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <PanelRutina rutina={rutinaGenero} />
                  </Box>
                </Box>
              )}
            </Box>
          </Fade>
        )}

      </Box>
    </Box>
  );
}
