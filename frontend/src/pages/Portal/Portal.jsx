import { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Paper, Chip,
  useTheme, useMediaQuery, Button, Fade,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CampaignIcon from '@mui/icons-material/Campaign';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import PanelRutina from '../../components/PanelRutina';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const pub = axios.create({ baseURL: BASE });

const ACCENT = '#06b6d4';

const GENERO = [
  { key: 'HOMBRE', label: 'Varón',  icon: <ManIcon  sx={{ fontSize: 36 }} /> },
  { key: 'MUJER',  label: 'Mujer',  icon: <WomanIcon sx={{ fontSize: 36 }} /> },
];

export default function Portal() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anuncios,  setAnuncios]  = useState([]);
  const [loadInit,  setLoadInit]  = useState(true);

  const [genero,    setGenero]    = useState(null);      // 'HOMBRE' | 'MUJER'
  const [rutinas,   setRutinas]   = useState([]);
  const [loadRut,   setLoadRut]   = useState(false);

  const [rutina,    setRutina]    = useState(null);      // objeto { tipo, nombre, ejercicios }
  const [loadEj,    setLoadEj]    = useState(false);

  useEffect(() => {
    pub.get('/portal/anuncios')
      .then(r => setAnuncios(r.data))
      .finally(() => setLoadInit(false));
  }, []);

  const elegirGenero = async (tipo) => {
    setGenero(tipo);
    setRutina(null);
    setRutinas([]);
    setLoadRut(true);
    try {
      const { data } = await pub.get(`/portal/rutinas/${tipo}`);
      setRutinas(data);
    } finally {
      setLoadRut(false);
    }
  };

  const elegirRutina = async (nombre) => {
    setLoadEj(true);
    setRutina(null);
    try {
      const { data } = await pub.get(`/portal/rutina/${genero}/${encodeURIComponent(nombre)}`);
      setRutina(data);
    } finally {
      setLoadEj(false);
    }
  };

  const volver = () => {
    if (rutina)  { setRutina(null);  return; }
    if (genero)  { setGenero(null); setRutinas([]); }
  };

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
            onClick={volver}
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
            Portal del Socio
          </Typography>
        </Box>
      </Box>

      {/* Cuerpo */}
      <Box sx={{ width: '100%', maxWidth: 720, px: { xs: 2, sm: 3 }, mt: { xs: 3, sm: 4 } }}>

        {/* Anuncios (siempre visibles) */}
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

        {/* PASO 1 — Elegir género */}
        {!genero && (
          <Fade in>
            <Box>
              <Paper sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center',
              }}>
                <FitnessCenterIcon sx={{ color: ACCENT, fontSize: 40, mb: 1.5 }} />
                <Typography fontWeight={700} color="#fff" fontSize={18} mb={0.5}>
                  ¿Cuál es tu rutina?
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 3 }}>
                  Elegí tu género para ver las rutinas disponibles
                </Typography>

                <Box display="flex" gap={2} justifyContent="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                  {GENERO.map(g => (
                    <Box
                      key={g.key}
                      onClick={() => elegirGenero(g.key)}
                      sx={{
                        flex: 1, maxWidth: 200, mx: 'auto',
                        p: 3,
                        borderRadius: 3,
                        border: '2px solid rgba(6,182,212,0.3)',
                        bgcolor: 'rgba(6,182,212,0.06)',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        transition: 'all 0.18s',
                        '&:hover': {
                          border: `2px solid ${ACCENT}`,
                          bgcolor: 'rgba(6,182,212,0.14)',
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 24px rgba(6,182,212,0.2)`,
                        },
                      }}
                    >
                      <Box sx={{ color: ACCENT }}>{g.icon}</Box>
                      <Typography fontWeight={700} color="#fff" fontSize={17}>{g.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Fade>
        )}

        {/* PASO 2 — Lista de rutinas */}
        {genero && !rutina && (
          <Fade in>
            <Box>
              <Typography fontWeight={700} color="#fff" fontSize={16} mb={2}>
                Rutinas para {genero === 'HOMBRE' ? 'Varones' : 'Mujeres'}
              </Typography>

              {loadRut ? (
                <Box display="flex" justifyContent="center" py={5}>
                  <CircularProgress sx={{ color: ACCENT }} />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {rutinas.map((nombre, i) => (
                    <Paper
                      key={nombre}
                      onClick={() => elegirRutina(nombre)}
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        borderRadius: 2.5,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        transition: 'all 0.15s',
                        '&:hover': {
                          bgcolor: 'rgba(6,182,212,0.1)',
                          border: `1px solid rgba(6,182,212,0.35)`,
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 2,
                        bgcolor: 'rgba(6,182,212,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Typography fontWeight={800} color={ACCENT} fontSize={14}>{i + 1}</Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography fontWeight={600} color="#fff" fontSize={14}>{nombre}</Typography>
                      </Box>
                      <FitnessCenterIcon sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }} />
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* PASO 3 — Ejercicios de la rutina seleccionada */}
        {genero && rutina && (
          <Fade in>
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <FitnessCenterIcon sx={{ color: ACCENT, fontSize: 20 }} />
                <Typography fontWeight={700} color="#fff" fontSize={15}>{rutina.nombre}</Typography>
                <Chip
                  label={genero === 'HOMBRE' ? 'Varones' : 'Mujeres'}
                  size="small"
                  sx={{ bgcolor: 'rgba(6,182,212,0.15)', color: ACCENT, fontWeight: 600, ml: 'auto' }}
                />
              </Box>

              {loadEj ? (
                <Box display="flex" justifyContent="center" py={5}>
                  <CircularProgress sx={{ color: ACCENT }} />
                </Box>
              ) : (
                <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <PanelRutina rutina={rutina} />
                </Box>
              )}
            </Box>
          </Fade>
        )}

      </Box>
    </Box>
  );
}
