import { useEffect, useState } from 'react';
import { Box, Typography, Chip, GlobalStyles } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import { ACENTO, ACERO, INK, HUESO, CROMO, BRILLO } from '../../theme';
import { portalApi } from './portalApi';

const esNuevo = (a) => (Date.now() - new Date(a.createdAt).getTime()) < 7 * 24 * 3600 * 1000;

/* Anuncios del gym al frente: carousel con rotación automática, borde con
   gradiente animado y megáfono. Se ve CON o SIN sesión iniciada. */
export default function AnunciosDestacados() {
  const [anuncios, setAnuncios] = useState([]);
  const [actual, setActual] = useState(0);

  useEffect(() => {
    portalApi.get('/anuncios').then((r) => setAnuncios(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (anuncios.length < 2) return;
    const timer = setInterval(() => setActual((a) => (a + 1) % anuncios.length), 6000);
    return () => clearInterval(timer);
  }, [anuncios.length]);

  if (!anuncios.length) return null;
  const anuncio = anuncios[actual];

  return (
    <Box sx={{ mb: 2, animation: 'sube 0.45s 0.1s ease-out both' }}>
      <GlobalStyles styles={{
        '@keyframes borde-vivo': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        '@keyframes mega': {
          '0%,100%': { transform: 'rotate(-8deg) scale(1)' },
          '12%': { transform: 'rotate(6deg) scale(1.12)' },
          '24%': { transform: 'rotate(-4deg) scale(1.05)' },
          '36%': { transform: 'rotate(2deg) scale(1)' },
        },
      }} />

      {/* Borde con gradiente animado */}
      <Box sx={{
        p: '2px', borderRadius: 4.5,
        background: 'linear-gradient(110deg, #F4F5F7, #9DA3AC, #F4F5F7)',
        backgroundSize: '220% 220%',
        animation: 'borde-vivo 5s ease infinite',
        boxShadow: `0 10px 30px rgba(0,0,0,0.5), ${BRILLO}`,
      }}>
        <Box sx={{
          borderRadius: 4, px: 2, py: 1.75,
          bgcolor: INK,
          display: 'flex', gap: 1.5, alignItems: 'flex-start',
          minHeight: 76,
        }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
            background: CROMO,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'mega 3.2s ease-in-out infinite',
            boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset, 0 0 18px rgba(255,255,255,0.22)',
          }}>
            <CampaignIcon sx={{ color: INK, fontSize: 24 }} />
          </Box>

          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={1} mb={0.25}>
              <Typography fontWeight={800} fontSize={14} noWrap sx={{ color: HUESO }}>
                {anuncio.titulo}
              </Typography>
              {esNuevo(anuncio) && (
                <Chip label="NUEVO" size="small" sx={{
                  height: 17, fontSize: 9.5, fontWeight: 900, letterSpacing: 0.5,
                  bgcolor: ACERO, color: INK,
                }} />
              )}
            </Box>
            <Typography fontSize={12.5} lineHeight={1.55} whiteSpace="pre-line"
              sx={{ color: 'rgba(244,244,242,0.7)' }}>
              {anuncio.contenido}
            </Typography>

            {anuncios.length > 1 && (
              <Box display="flex" gap={0.6} mt={1}>
                {anuncios.map((_a, i) => (
                  <Box key={i} onClick={() => setActual(i)} sx={{
                    width: i === actual ? 18 : 6, height: 6, borderRadius: 3,
                    bgcolor: i === actual ? ACENTO : 'rgba(244,244,242,0.25)',
                    cursor: 'pointer', transition: 'all 0.3s',
                  }} />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
