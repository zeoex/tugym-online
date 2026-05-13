import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress, Chip, Divider,
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { EJERCICIO_EN, getDescripcion, getYoutubeUrl } from '../data/ejercicioDemos';

export default function EjercicioDemoModal({ nombre, musculo, metaColor, metaBg, open, onClose }) {
  const [imgUrl, setImgUrl]       = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError]   = useState(false);

  useEffect(() => {
    if (!open || !nombre) return;
    setImgUrl(null);
    setImgError(false);

    const englishName = EJERCICIO_EN[nombre];
    if (!englishName) { setImgError(true); return; }

    let cancelled = false;
    setImgLoading(true);

    (async () => {
      try {
        const searchRes = await fetch(
          `https://wger.de/api/v2/exercise/?format=json&name=${encodeURIComponent(englishName)}&language=2&limit=5`
        );
        if (cancelled) return;
        const searchData = await searchRes.json();

        if (!searchData.results?.length) { setImgError(true); return; }

        const baseId = searchData.results[0].exercise_base;

        const imgRes = await fetch(
          `https://wger.de/api/v2/exerciseimage/?format=json&exercise_base=${baseId}&limit=5`
        );
        if (cancelled) return;
        const imgData = await imgRes.json();

        if (imgData.results?.length) {
          setImgUrl(imgData.results[0].image);
        } else {
          setImgError(true);
        }
      } catch {
        if (!cancelled) setImgError(true);
      } finally {
        if (!cancelled) setImgLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, nombre]);

  const color = metaColor || '#0ea5e9';
  const bg    = metaBg    || '#e0f2fe';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0.5 }}>
        <FitnessCenterIcon sx={{ color, flexShrink: 0 }} />
        <Box flex={1} minWidth={0}>
          <Typography fontWeight={700} fontSize={17} noWrap>{nombre}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        {musculo && (
          <Chip
            label={musculo}
            size="small"
            sx={{ mb: 2, bgcolor: bg, color, fontWeight: 700 }}
          />
        )}

        {/* Descripción */}
        <Typography variant="body2" color="text.secondary" lineHeight={1.75} mb={2}>
          {getDescripcion(nombre)}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Imagen / estado */}
        {imgLoading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={1.5}>
            <CircularProgress size={32} sx={{ color }} />
            <Typography variant="caption" color="text.secondary">
              Cargando demostración…
            </Typography>
          </Box>
        ) : imgUrl ? (
          <Box
            component="img"
            src={imgUrl}
            alt={nombre}
            onError={() => { setImgUrl(null); setImgError(true); }}
            sx={{
              display: 'block',
              width: '100%',
              maxHeight: 320,
              objectFit: 'contain',
              borderRadius: 2,
              bgcolor: '#f8fafc',
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
        ) : (
          <Box
            display="flex" flexDirection="column" alignItems="center"
            py={3} gap={1}
            sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}
          >
            <ImageNotSupportedIcon sx={{ color: 'text.disabled', fontSize: 36 }} />
            <Typography variant="caption" color="text.disabled" textAlign="center">
              No hay imagen disponible para este ejercicio.
              <br />Usá el botón de YouTube para ver un tutorial.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          startIcon={<YouTubeIcon />}
          component="a"
          href={getYoutubeUrl(nombre)}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: '#ff0000', mr: 'auto' }}
        >
          Ver en YouTube
        </Button>
        <Button variant="contained" onClick={onClose} sx={{ bgcolor: color, '&:hover': { bgcolor: color, filter: 'brightness(0.9)' } }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
