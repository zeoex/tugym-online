import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Chip, Divider, IconButton,
  useTheme, useMediaQuery,
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { getImagen, getDescripcion, getYoutubeUrl } from '../data/ejercicioDemos';
import ANIMACIONES from '../data/ejercicioAnimaciones.json';

/* Video de YouTube: miniatura con botón de play; el iframe recién se carga al
   tocar (no gasta datos ni autoreproduce). Dominio nocookie: sin rastreo. */
function VideoYoutube({ id, titulo, isMobile }) {
  const [activo, setActivo] = useState(false);
  return (
    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
      {activo ? (
        <Box
          component="iframe"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
          title={titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      ) : (
        <Box
          component="button" type="button" onClick={() => setActivo(true)}
          aria-label={`Reproducir video: ${titulo}`}
          sx={{
            position: 'absolute', inset: 0, width: '100%', border: 0, p: 0, cursor: 'pointer',
            backgroundImage: `url(https://img.youtube.com/vi/${id}/hqdefault.jpg)`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Box sx={{
            width: isMobile ? 58 : 68, height: isMobile ? 58 : 68, borderRadius: '50%',
            bgcolor: 'rgba(255,0,0,0.92)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
          }}>
            <PlayArrowIcon sx={{ fontSize: 40 }} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

/* Galería: imagen grande + tira de miniaturas. Con una sola imagen no hay tira. */
function Galeria({ imagenes, nombre, isMobile }) {
  const [i, setI] = useState(0);
  useEffect(() => { setI(0); }, [imagenes]);
  const actual = imagenes[Math.min(i, imagenes.length - 1)];
  const varias = imagenes.length > 1;
  const mover = (d) => setI((v) => (v + d + imagenes.length) % imagenes.length);

  return (
    <Box>
      <Box sx={{ position: 'relative' }}>
        <Box
          component="img" src={actual} alt={`${nombre} — imagen ${i + 1} de ${imagenes.length}`}
          sx={{
            display: 'block', width: '100%', maxHeight: isMobile ? 300 : 360, objectFit: 'contain',
            borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider',
          }}
        />
        {varias && (
          <>
            <IconButton onClick={() => mover(-1)} aria-label="Imagen anterior" size="small"
              sx={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={() => mover(1)} aria-label="Imagen siguiente" size="small"
              sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}>
              <ChevronRightIcon />
            </IconButton>
            <Chip label={`${i + 1} / ${imagenes.length}`} size="small"
              sx={{ position: 'absolute', right: 8, bottom: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontWeight: 700, fontSize: 11 }} />
          </>
        )}
      </Box>
      {varias && (
        <Box sx={{ display: 'flex', gap: 0.75, mt: 1, overflowX: 'auto', pb: 0.5 }}>
          {imagenes.map((src, k) => (
            <Box
              key={src} component="button" type="button" onClick={() => setI(k)}
              aria-label={`Ver imagen ${k + 1}`} aria-pressed={k === i}
              sx={{
                flexShrink: 0, width: 56, height: 56, p: 0, borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer',
                border: '2px solid', borderColor: k === i ? 'primary.main' : 'transparent', bgcolor: '#fff',
              }}
            >
              <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function EjercicioDemoModal({ nombre, musculo, media, metaColor, metaBg, open, onClose }) {
  const [imgError, setImgError] = useState(false);
  const [gifError, setGifError] = useState(false);
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Media resuelta por el servidor (sobrevive renombres). Las imágenes y videos
  // propios del gym van primero; si no hay, el GIF del catálogo; y por último
  // la búsqueda por nombre y la imagen estática.
  const anim     = media || ANIMACIONES[nombre];
  const imagenes = Array.isArray(anim?.imagenes) ? anim.imagenes.filter(Boolean) : [];
  const videos   = Array.isArray(anim?.videos) ? anim.videos.filter((v) => v?.id) : (anim?.videoId ? [{ id: anim.videoId, url: anim.video }] : []);
  const gifUrl   = !imagenes.length && !gifError && anim?.gif ? anim.gif : null;
  const imgUrl   = getImagen(nombre);
  const color    = metaColor || '#0ea5e9';
  const bg       = metaBg    || '#e0f2fe';
  const hayDemo  = imagenes.length > 0 || videos.length > 0 || gifUrl || (imgUrl && !imgError);

  const linkYoutube = videos[0]?.url
    || (anim?.nombreEn
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${anim.nombreEn} exercise proper form`)}`
      : getYoutubeUrl(nombre));

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
          <IconButton onClick={onClose} size="small" sx={{ ml: 0.5, flexShrink: 0 }} aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        {musculo && (
          <Chip label={musculo} size="small" sx={{ mb: 2, bgcolor: bg, color, fontWeight: 700 }} />
        )}

        {anim?.pasos?.length ? (
          anim.pasos.length === 1 ? (
            <Typography variant="body2" color="text.secondary" lineHeight={1.75} mb={2} whiteSpace="pre-line">
              {anim.pasos[0]}
            </Typography>
          ) : (
            <Box component="ol" sx={{ pl: 2.5, m: 0, mb: 2 }}>
              {anim.pasos.map((paso, i) => (
                <Typography key={i} component="li" variant="body2" color="text.secondary" lineHeight={1.7} mb={0.5}>
                  {paso}
                </Typography>
              ))}
            </Box>
          )
        ) : (
          <Typography variant="body2" color="text.secondary" lineHeight={1.75} mb={2}>
            {getDescripcion(nombre)}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        <Box display="flex" flexDirection="column" gap={2}>
          {imagenes.length > 0 && <Galeria imagenes={imagenes} nombre={nombre} isMobile={isMobile} />}

          {videos.map((v) => (
            <VideoYoutube key={v.id} id={v.id} titulo={`${nombre} — video`} isMobile={isMobile} />
          ))}

          {gifUrl && (
            <Box
              component="img" src={gifUrl} alt={`Demostración animada: ${nombre}`}
              onError={() => setGifError(true)}
              sx={{
                display: 'block', width: '100%', maxHeight: isMobile ? 280 : 340, objectFit: 'contain',
                borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider',
              }}
            />
          )}

          {!imagenes.length && !videos.length && !gifUrl && imgUrl && !imgError && (
            <Box
              component="img" src={imgUrl} alt={nombre}
              onError={() => setImgError(true)}
              sx={{
                display: 'block', width: '100%', maxHeight: isMobile ? 260 : 320, objectFit: 'contain',
                borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider',
              }}
            />
          )}

          {!hayDemo && (
            <Box
              display="flex" flexDirection="column" alignItems="center" py={3} gap={1}
              sx={{ bgcolor: 'action.hover', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}
            >
              <ImageNotSupportedIcon sx={{ color: 'text.disabled', fontSize: 36 }} />
              <Typography variant="caption" color="text.disabled" textAlign="center">
                No hay imagen disponible para este ejercicio.
                <br />Usá el botón de YouTube para ver un tutorial.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          startIcon={<YouTubeIcon />}
          component="a"
          href={linkYoutube}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: '#ff0000', mr: 'auto' }}
        >
          {videos.length ? 'Abrir en YouTube' : isMobile ? 'YouTube' : 'Ver en YouTube'}
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
