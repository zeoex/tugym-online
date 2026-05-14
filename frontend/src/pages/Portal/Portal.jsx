import { useEffect, useState } from 'react';
import {
  Box, Typography, Autocomplete, TextField, CircularProgress, Chip,
  Avatar, Paper, Alert, Divider, useTheme, useMediaQuery,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CampaignIcon from '@mui/icons-material/Campaign';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import PanelRutina from '../../components/PanelRutina';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const pub = axios.create({ baseURL: BASE });

const SEXO_ICON = {
  MASCULINO: <ManIcon sx={{ fontSize: 32 }} />,
  FEMENINO:  <WomanIcon sx={{ fontSize: 32 }} />,
  OTROS:     <PersonIcon sx={{ fontSize: 32 }} />,
};

const ESTADO_COLOR = { ACTIVO: 'success', VENCIDO: 'error', INACTIVO: 'default' };
const ACCENT = '#06b6d4';

export default function Portal() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [socios,    setSocios]   = useState([]);
  const [anuncios,  setAnuncios] = useState([]);
  const [selected,  setSelected] = useState(null);
  const [data,      setData]     = useState(null);
  const [loading,   setLoading]  = useState(false);
  const [loadInit,  setLoadInit] = useState(true);

  useEffect(() => {
    Promise.all([
      pub.get('/portal/socios'),
      pub.get('/portal/anuncios'),
    ]).then(([s, a]) => {
      setSocios(s.data);
      setAnuncios(a.data);
    }).finally(() => setLoadInit(false));
  }, []);

  const handleSelect = async (_, socio) => {
    setSelected(socio);
    setData(null);
    if (!socio) return;
    setLoading(true);
    try {
      const { data: res } = await pub.get(`/portal/socio/${socio.id}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  const pagoVence = data?.socio?.pagos?.[0]?.fechaVencimiento;

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
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'rgba(15,23,42,0.85)',
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 1.5,
          bgcolor: ACCENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 18px rgba(6,182,212,0.4)`,
        }}>
          <FitnessCenterIcon sx={{ color: '#fff', fontSize: 20 }} />
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

      {/* Contenido */}
      <Box sx={{ width: '100%', maxWidth: 720, px: { xs: 2, sm: 3 }, mt: { xs: 3, sm: 4 } }}>

        {/* Selector de socio */}
        <Paper sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          mb: 3,
        }}>
          <Typography fontWeight={700} color="#fff" mb={0.5} fontSize={15}>
            ¿Quién sos?
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 1.5 }}>
            Buscá tu nombre para ver tu rutina y los anuncios del gym
          </Typography>
          {loadInit ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} sx={{ color: ACCENT }} />
            </Box>
          ) : (
            <Autocomplete
              options={socios}
              getOptionLabel={s => `${s.apellido}, ${s.nombre}`}
              onChange={handleSelect}
              noOptionsText="No encontrado"
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscá por nombre o apellido..."
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.07)',
                      borderRadius: 2,
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                      '&.Mui-focused fieldset': { borderColor: ACCENT },
                    },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />
              )}
              renderOption={(props, s) => (
                <Box component="li" {...props} sx={{ gap: 1.5, py: '10px !important' }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: ACCENT, fontSize: 13, flexShrink: 0 }}>
                    {s.nombre[0]}{s.apellido[0]}
                  </Avatar>
                  <Typography fontSize={14}>{s.apellido}, {s.nombre}</Typography>
                </Box>
              )}
            />
          )}
        </Paper>

        {/* Cargando socio */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: ACCENT }} />
          </Box>
        )}

        {/* Datos del socio seleccionado */}
        {data && !loading && (
          <>
            {/* Card perfil */}
            <Paper sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
            }}>
              <Avatar
                src={data.socio.foto ? `${BASE.replace('/api', '')}${data.socio.foto}` : undefined}
                sx={{ width: 52, height: 52, bgcolor: ACCENT, flexShrink: 0 }}
              >
                {SEXO_ICON[data.socio.sexo] ?? <PersonIcon />}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography fontWeight={700} color="#fff" fontSize={16} noWrap>
                  {data.socio.apellido}, {data.socio.nombre}
                </Typography>
                {pagoVence && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                    Vence el {new Date(pagoVence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Typography>
                )}
              </Box>
              <Chip
                label={data.socio.estado}
                color={ESTADO_COLOR[data.socio.estado] || 'default'}
                size="small"
                sx={{ fontWeight: 700, flexShrink: 0 }}
              />
            </Paper>

            {/* Anuncios */}
            {anuncios.length > 0 && (
              <Box mb={3}>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <CampaignIcon sx={{ color: ACCENT, fontSize: 20 }} />
                  <Typography fontWeight={700} color="#fff" fontSize={15}>
                    Anuncios del gym
                  </Typography>
                </Box>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {anuncios.map(a => (
                    <Paper
                      key={a.id}
                      sx={{
                        p: { xs: 1.75, sm: 2 },
                        borderRadius: 2.5,
                        bgcolor: 'rgba(6,182,212,0.08)',
                        border: '1px solid rgba(6,182,212,0.25)',
                      }}
                    >
                      <Typography fontWeight={700} color="#fff" fontSize={14} mb={0.5}>
                        {a.titulo}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                        {a.contenido}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            {/* Rutina */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <FitnessCenterIcon sx={{ color: ACCENT, fontSize: 20 }} />
                <Typography fontWeight={700} color="#fff" fontSize={15}>
                  Tu rutina asignada
                </Typography>
              </Box>

              {data.rutina ? (
                <Box sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <PanelRutina rutina={data.rutina} />
                </Box>
              ) : (
                <Paper sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'center',
                }}>
                  <FitnessCenterIcon sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 40, mb: 1 }} />
                  <Typography color="rgba(255,255,255,0.55)" fontWeight={600}>
                    Tu coach todavía no te asignó una rutina.
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                    Consultale para que la configure en tu perfil.
                  </Typography>
                </Paper>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
