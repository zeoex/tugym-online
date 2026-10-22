import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Button, Collapse, Paper, GlobalStyles, IconButton,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';
import BadgeIcon from '@mui/icons-material/Badge';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InstagramIcon from '@mui/icons-material/Instagram';
import PhoneIcon from '@mui/icons-material/Phone';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { ACENTO, INK, NOCHE, FUENTE_TITULOS } from '../../theme';
import { portalApi, sesionSocio } from './portalApi';
import AnunciosDestacados from './AnunciosDestacados';
import LoginSocio from './LoginSocio';
import SolicitudSocioForm from './SolicitudSocioForm';
import HeroSlideshow, { SLIDES, DURACION_SLIDE, CAJA_TITULO } from './HeroSlideshow';

const HUESO = '#F2F5EA';

/* El titular: condensada, enorme, dos líneas. Lo renderizan dos capas —
   esta (accesible, transparente) y la recortada sobre la foto. */
function Titular() {
  return (
    <Box component="span" sx={{
      display: 'block', textAlign: 'center', textTransform: 'uppercase',
      fontFamily: FUENTE_TITULOS, fontWeight: 700,
      fontSize: 'clamp(88px, 24vw, 240px)',
      lineHeight: 0.84, letterSpacing: '-0.01em',
    }}>
      Entrená<br />hoy
    </Box>
  );
}

const FEATURES = [
  {
    icon: <WhereToVoteIcon />,
    titulo: 'Check-in desde el celular',
    texto: 'Llegás, tocás un botón y tu asistencia queda registrada. Sin tarjetas, sin filas.',
  },
  {
    icon: <FitnessCenterIcon />,
    titulo: 'Tu rutina con animaciones',
    texto: 'Cada ejercicio con su animación y los pasos en español. La que te armó tu profe, más la del día.',
    gif: '/anim/0003.gif',
  },
  {
    icon: <BadgeIcon />,
    titulo: 'Carnet digital con QR',
    texto: 'Tu credencial siempre en el bolsillo, con el estado de tu cuota al día.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [info, setInfo] = useState(null);
  const [sesion, setSesion] = useState(sesionSocio.activa());
  // Panel colgando de la barra: null | 'login' | 'alta'
  const [panel, setPanel] = useState(() => (params.get('ingresar') ? 'login' : null));
  const loginAbierto = panel !== null;
  const setLoginAbierto = (abrir) => setPanel(abrir ? 'login' : null);

  // El portal manda acá con ?ingresar=1 cuando no hay sesión; una vez abierto, limpiamos la URL.
  useEffect(() => {
    if (params.get('ingresar')) setParams({}, { replace: true });
  }, [params, setParams]);
  const [slide, setSlide] = useState(0);
  const [ciclo, setCiclo] = useState(0); // reinicia la barra de progreso al tocar un slide

  useEffect(() => {
    portalApi.get('/info').then((r) => setInfo(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setSlide((s) => (s + 1) % SLIDES.length); setCiclo((c) => c + 1); }, DURACION_SLIDE);
    return () => clearTimeout(t);
  }, [slide, ciclo]);

  const irA = useCallback((i) => { setSlide(i); setCiclo((c) => c + 1); }, []);

  const nombre = sesionSocio.nombre();
  const entrar = () => (sesion ? navigate('/portal') : setPanel('login'));
  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hoy = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: NOCHE, color: HUESO }}>
      <GlobalStyles styles={{
        '@keyframes progreso': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        '@keyframes pulso': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(200,241,63,0.6)' },
          '70%':     { boxShadow: '0 0 0 9px rgba(200,241,63,0)' },
        },
        '@keyframes sube': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      }} />

      {/* ── Barra superior: nombre del gym + ingreso ── */}
      {/* Pegada arriba mientras está cerrada; con un formulario abierto scrollea
          con la página para que el botón de enviar nunca quede fuera de la pantalla. */}
      <Box component="header" sx={{
        position: loginAbierto && !sesion ? 'relative' : 'sticky', top: 0, zIndex: 30,
        bgcolor: 'rgba(11,13,8,0.72)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(242,245,234,0.07)',
      }}>
        <Box sx={{
          maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 3 }, py: 1.25,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: 2, flexShrink: 0,
            bgcolor: ACENTO, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px rgba(200,241,63,0.35)',
          }}>
            <FitnessCenterIcon sx={{ color: INK, fontSize: 20 }} />
          </Box>
          <Typography sx={{
            fontFamily: FUENTE_TITULOS, fontWeight: 700, fontSize: 22, letterSpacing: '0.02em',
            textTransform: 'uppercase', flexGrow: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {info?.nombreGym || 'TuGymOnLine'}
          </Typography>

          {sesion ? (
            <Button
              variant="contained" size="small" onClick={() => navigate('/portal')}
              sx={{ px: 2, whiteSpace: 'nowrap' }}
            >
              {nombre ? `Hola, ${nombre.split(' ')[0]}` : 'Mi portal'}
              <ArrowOutwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
            </Button>
          ) : loginAbierto ? (
            <IconButton onClick={() => setLoginAbierto(false)} aria-label="Cerrar ingreso" sx={{ color: HUESO }}>
              <CloseIcon />
            </IconButton>
          ) : (
            <Button
              variant="outlined" size="small" onClick={() => setLoginAbierto(true)}
              sx={{
                px: 2.25, color: HUESO, borderColor: 'rgba(242,245,234,0.3)',
                '&:hover': { borderColor: ACENTO, color: ACENTO, bgcolor: 'rgba(200,241,63,0.06)' },
              }}
            >
              Ingresar
            </Button>
          )}
        </Box>

        {/* Formulario colgando de la barra: ingreso o pedido de alta */}
        <Collapse in={loginAbierto && !sesion} unmountOnExit>
          <Box sx={{ borderTop: '1px solid rgba(242,245,234,0.07)', bgcolor: 'rgba(11,13,8,0.6)' }}>
            <Box sx={{ maxWidth: panel === 'alta' ? 560 : 420, mx: 'auto', px: 2, py: 3 }}>
              {panel === 'alta' ? (
                <SolicitudSocioForm onIngresar={() => setPanel('login')} />
              ) : (
                <LoginSocio compacto onIngreso={() => { setSesion(true); setPanel(null); navigate('/portal'); }} />
              )}
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'rgba(242,245,234,0.6)' }}>
                {panel === 'alta' ? '¿Ya sos socio? ' : '¿Todavía no sos socio? '}
                <Box component="button" type="button" onClick={() => setPanel(panel === 'alta' ? 'login' : 'alta')}
                  sx={{ background: 'none', border: 0, p: 0, color: ACENTO, cursor: 'pointer', font: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
                  {panel === 'alta' ? 'Ingresá' : 'Pedí tu alta'}
                </Box>
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* ── Hero ── */}
      <Box component="section" aria-label="Portada" sx={{
        position: 'relative', overflow: 'hidden',
        minHeight: 'calc(100dvh - 58px)',
        display: 'flex', flexDirection: 'column',
      }}>
        <HeroSlideshow actual={slide} texto={<Titular />} />

        {/* Titular accesible. Mismo lugar que la copia recortada; invisible si
            el navegador sabe recortar, sólido si no. */}
        <Typography component="h1" sx={{
          ...CAJA_TITULO, m: 0, color: 'transparent', pointerEvents: 'none',
          WebkitTextStroke: '1px rgba(242,245,234,0.22)',
          '@supports not (-webkit-background-clip: text)': { color: HUESO, WebkitTextStroke: 0 },
        }}>
          <Titular />
        </Typography>

        {/* Cejilla: lo que está pasando ahora */}
        <Box sx={{
          position: 'relative', zIndex: 2,
          maxWidth: 1100, width: '100%', mx: 'auto', px: { xs: 2, md: 3 }, pt: 3,
          display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap',
          animation: 'sube 0.5s ease-out both',
        }}>
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: ACENTO, animation: 'pulso 2s ease-out infinite' }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACENTO }}>
            {info?.entrenandoAhora > 0
              ? `${info.entrenandoAhora} entrenando ahora`
              : 'En vivo'}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'rgba(242,245,234,0.6)' }}>
            · {hoy}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Bajada + acciones */}
        <Box sx={{
          position: 'relative', zIndex: 2,
          maxWidth: 1100, width: '100%', mx: 'auto', px: { xs: 2, md: 3 }, pb: { xs: 3, md: 5 },
          display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' },
          justifyContent: 'space-between', gap: 3,
          animation: 'sube 0.5s 0.15s ease-out both',
        }}>
          <Typography sx={{ fontSize: { xs: 16, md: 19 }, lineHeight: 1.5, maxWidth: 440, color: 'rgba(242,245,234,0.82)' }}>
            Hacé el check-in desde el celular, seguí tu rutina con animaciones
            y llevá tu carnet digital. Todo lo que necesitás para entrenar, en una sola app.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained" size="large" onClick={entrar}
              startIcon={sesion ? <WhereToVoteIcon /> : <PlayArrowIcon />}
              sx={{ px: 3.5, py: 1.4, fontSize: 16, minHeight: 52, flexGrow: { xs: 1, md: 0 } }}
            >
              {sesion ? 'Hacer check-in' : 'Entrar al portal'}
            </Button>
            <Button
              variant="outlined" size="large"
              onClick={() => (sesion ? navigate('/portal/rutina') : setPanel('alta'))}
              sx={{
                px: 3, minHeight: 52, color: HUESO, borderColor: 'rgba(242,245,234,0.3)',
                flexGrow: { xs: 1, md: 0 },
                '&:hover': { borderColor: HUESO, bgcolor: 'rgba(242,245,234,0.06)' },
              }}
            >
              {sesion ? 'Ver mi rutina' : 'Quiero ser socio'}
            </Button>
          </Box>
        </Box>

        {/* Progreso del slideshow: una barra por foto, se llena la activa */}
        <Box sx={{
          position: 'relative', zIndex: 2,
          maxWidth: 1100, width: '100%', mx: 'auto', px: { xs: 2, md: 3 }, pb: 2,
          display: 'flex', gap: 0.75,
        }} role="tablist" aria-label="Fotos del gimnasio">
          {SLIDES.map((_, i) => (
            <Box
              key={i} role="tab" aria-selected={i === slide} aria-label={`Foto ${i + 1}`}
              onClick={() => irA(i)}
              sx={{ flex: 1, py: 1.25, cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}
            >
              <Box sx={{ width: '100%', height: 2, bgcolor: 'rgba(242,245,234,0.22)', overflow: 'hidden' }}>
                {i === slide && (
                  <Box key={ciclo} sx={{
                    height: '100%', bgcolor: ACENTO, transformOrigin: 'left',
                    animation: `progreso ${DURACION_SLIDE}ms linear both`,
                  }} />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Debajo del hero ── */}
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 3 }, pt: 4, pb: 6 }}>
        <AnunciosDestacados />

        <Box sx={{
          display: 'grid', gap: 2, mt: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}>
          {FEATURES.map((f) => (
            <Paper key={f.titulo} sx={{ p: 2.5, position: 'relative', overflow: 'hidden', minHeight: 170 }}>
              {f.gif && (
                <Box
                  component="img" src={f.gif} alt="" loading="lazy" aria-hidden
                  sx={{
                    position: 'absolute', right: -10, bottom: -10, width: 120, height: 120,
                    objectFit: 'cover', borderRadius: '50%', opacity: 0.9,
                    /* El GIF viene sobre blanco: invertido + screen, el fondo desaparece
                       sobre la tarjeta oscura y el hue-rotate devuelve los colores. */
                    filter: 'invert(1) hue-rotate(180deg)', mixBlendMode: 'screen',
                    maskImage: 'radial-gradient(circle, #000 55%, transparent 72%)',
                    WebkitMaskImage: 'radial-gradient(circle, #000 55%, transparent 72%)',
                  }}
                />
              )}
              <Box sx={{
                width: 40, height: 40, borderRadius: 2.5, mb: 1.5,
                bgcolor: 'rgba(200,241,63,0.12)', color: ACENTO,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {f.icon}
              </Box>
              <Typography sx={{ fontFamily: FUENTE_TITULOS, fontWeight: 700, fontSize: 24, lineHeight: 1.1, mb: 0.75 }}>
                {f.titulo}
              </Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(242,245,234,0.62)', maxWidth: f.gif ? 'calc(100% - 96px)' : 'none' }}>
                {f.texto}
              </Typography>
            </Paper>
          ))}
        </Box>

        {(info?.horarios || info?.instagram || info?.telefono) && (
          <Paper sx={{ mt: 2, p: 2.5, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 4 } }}>
            {info.horarios && (
              <Box display="flex" gap={1.25} alignItems="flex-start">
                <ScheduleIcon sx={{ fontSize: 20, color: ACENTO, mt: 0.1 }} />
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(242,245,234,0.45)' }}>Horarios</Typography>
                  <Typography fontSize={14}>{info.horarios}</Typography>
                </Box>
              </Box>
            )}
            {info.telefono && (
              <Box component="a" href={`tel:${info.telefono}`} display="flex" gap={1.25} alignItems="flex-start" sx={{ textDecoration: 'none', color: 'inherit' }}>
                <PhoneIcon sx={{ fontSize: 20, color: ACENTO, mt: 0.1 }} />
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(242,245,234,0.45)' }}>Teléfono</Typography>
                  <Typography fontSize={14}>{info.telefono}</Typography>
                </Box>
              </Box>
            )}
            {info.instagram && (
              <Box component="a" href={`https://instagram.com/${info.instagram}`} target="_blank" rel="noopener noreferrer"
                display="flex" gap={1.25} alignItems="flex-start" sx={{ textDecoration: 'none', color: 'inherit' }}>
                <InstagramIcon sx={{ fontSize: 20, color: '#E1306C', mt: 0.1 }} />
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(242,245,234,0.45)' }}>Instagram</Typography>
                  <Typography fontSize={14} fontWeight={600} sx={{ color: ACENTO }}>@{info.instagram}</Typography>
                </Box>
              </Box>
            )}
          </Paper>
        )}

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(242,245,234,0.25)', fontSize: 11 }}>
            &copy; ZeoDev 2026
          </Typography>
          <Typography component={RouterLink} to="/login" variant="caption"
            sx={{ color: 'rgba(242,245,234,0.35)', fontSize: 11, textDecoration: 'none', '&:hover': { color: HUESO } }}>
            Acceso administración
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
