import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Chip, Divider, IconButton,
  useTheme, useMediaQuery,
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import CloseIcon from '@mui/icons-material/Close';
import { getImagen, getDescripcion, getYoutubeUrl } from '../data/ejercicioDemos';
import ANIMACIONES from '../data/ejercicioAnimaciones.json';

export default function EjercicioDemoModal({ nombre, musculo, metaColor, metaBg, open, onClose }) {
  const [imgError, setImgError] = useState(false);
  const [gifError, setGifError] = useState(false);
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // GIF animado del dataset si existe; si falla, cae a la imagen estática de siempre.
  const anim   = ANIMACIONES[nombre];
  const gifUrl = !gifError && anim ? anim.gif : null;
  const imgUrl = getImagen(nombre);
  const color  = metaColor || '#0ea5e9';
  const bg     = metaBg    || '#e0f2fe';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0.5, pr: isMobile ? 1 : 2 }}>
        <FitnessCenterIcon sx={{ color, flexShrink: 0 }} />
        <Box flex={1} minWidth={0}>
          <Typography fontWeight={700} fontSize={17} sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
            {nombre}
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={onClose} size="small" sx={{ ml: 0.5, flexShrink: 0 }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        {musculo && (
          <Chip
            label={musculo}
            size="small"
            sx={{ mb: 2, bgcolor: bg, color, fontWeight: 700 }}
          />
        )}

        {anim?.pasos?.length ? (
          <Box component="ol" sx={{ pl: 2.5, m: 0, mb: 2 }}>
            {anim.pasos.map((paso, i) => (
              <Typography key={i} component="li" variant="body2" color="text.secondary" lineHeight={1.7} mb={0.5}>
                {paso}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" lineHeight={1.75} mb={2}>
            {getDescripcion(nombre)}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        {gifUrl ? (
          <Box
            component="img"
            src={gifUrl}
            alt={`Demostración animada: ${nombre}`}
            onError={() => setGifError(true)}
            sx={{
              display: 'block',
              width: '100%',
              maxHeight: isMobile ? 280 : 340,
              objectFit: 'contain',
              borderRadius: 2,
              bgcolor: '#fff',
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
        ) : imgUrl && !imgError ? (
          <Box
            component="img"
            src={imgUrl}
            alt={nombre}
            onError={() => setImgError(true)}
            sx={{
              display: 'block',
              width: '100%',
              maxHeight: isMobile ? 260 : 320,
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
          {isMobile ? 'YouTube' : 'Ver en YouTube'}
        </Button>
        {!isMobile && (
          <Button
            variant="contained"
            onClick={onClose}
            sx={{ bgcolor: color, '&:hover': { bgcolor: color, filter: 'brightness(0.9)' } }}
          >
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
