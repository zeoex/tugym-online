import { useEffect, useRef, useState } from 'react';
import { Box, GlobalStyles } from '@mui/material';
import { NOCHE } from '../../theme';

/* Fotos del hero (frontend/public/hero). El thumb de 32 px entra primero para
   que el hero nunca aparezca vacío.
   - Celular (vertical): las fotos REALES de Torino Fitness, sacadas de su
     Instagram (m1–m4, verticales), intercaladas con dos de stock.
   - Pantalla ancha: fotos horizontales de stock a 1920 px — las de Instagram
     son chicas para ese tamaño. La de la barra abre (es la que mejor se ve a
     través de las letras); la silueta casi negra va última. */
const slide = (n) => ({ src: `/hero/${n}.jpg`, thumb: `/hero/${n}-thumb.jpg` });
export const SLIDES_ANCHO = ['02', '06', '04', '03', '05', '01'].map(slide);
export const SLIDES_MOVIL = ['m1', 'm2', '02', 'm3', '06', '04'].map(slide);

export const esPantallaMovil = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(max-width: 720px) and (orientation: portrait)').matches;

export const SLIDES = SLIDES_ANCHO;
export function useSlides() {
  const [slides] = useState(() => (esPantallaMovil() ? SLIDES_MOVIL : SLIDES_ANCHO));
  return slides;
}

export const DURACION_SLIDE = 6500;
const DURACION_CORTE = 1100;

/* Caja del titular. La usan las dos copias del texto (la accesible en la
   landing y la recortada acá) para que queden pixel a pixel una sobre otra. */
export const CAJA_TITULO = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  pb: '16vh', px: 2,
};

/* La misma foto se pinta dos veces: atenuada como fondo, y a pleno a través de
   las letras (background-clip: text). Las dos capas comparten tamaño y
   posición, así la foto que se ve dentro de "ENTRENÁ" es exactamente la que
   está detrás. Cada cambio de foto entra con un corte diagonal — como el
   trazo de una barra que sube — en vez de un fundido. */
const capaFoto = (src) => ({
  position: 'absolute', inset: 0,
  backgroundImage: `url(${src})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center 35%',
});

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HeroSlideshow({ actual, texto, children, slides = SLIDES }) {
  const [listas, setListas] = useState(() => new Set());
  const [visibles, setVisibles] = useState([actual]); // pila: [anterior?, actual]
  const anterior = useRef(actual);

  // Precarga: la actual y la que sigue. Mientras no llegó, se ve el thumb.
  useEffect(() => {
    [actual, (actual + 1) % slides.length].forEach((i) => {
      if (listas.has(i)) return;
      const img = new Image();
      img.onload = () => setListas((s) => new Set(s).add(i));
      img.src = slides[i].src;
    });
  }, [actual, listas, slides]);

  // Mantener la anterior montada mientras dura el corte, después soltarla.
  useEffect(() => {
    if (anterior.current === actual) return;
    const previa = anterior.current;
    anterior.current = actual;
    setVisibles([previa, actual]);
    const t = setTimeout(() => setVisibles([actual]), DURACION_CORTE + 50);
    return () => clearTimeout(t);
  }, [actual]);

  const entrada = reduceMotion()
    ? `aparece 0.6s ease-out both`
    : `corte ${DURACION_CORTE}ms cubic-bezier(0.76, 0, 0.24, 1) both`;

  const fuente = (i) => (listas.has(i) ? slides[i].src : slides[i].thumb);

  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', bgcolor: NOCHE }}>
      <GlobalStyles styles={{
        '@keyframes corte': {
          from: { clipPath: 'polygon(-35% 0, -5% 0, -35% 100%, -65% 100%)' },
          to:   { clipPath: 'polygon(-35% 0, 135% 0, 165% 100%, -65% 100%)' },
        },
        '@keyframes aparece': { from: { opacity: 0 }, to: { opacity: 1 } },
        '@keyframes respira': {
          from: { transform: 'scale(1.06)' },
          to:   { transform: 'scale(1)' },
        },
        '@keyframes borde-corte': {
          from: { transform: 'translateX(-70vw) skewX(-16deg)', opacity: 1 },
          '85%': { opacity: 1 },
          to:   { transform: 'translateX(130vw) skewX(-16deg)', opacity: 0 },
        },
      }} />

      {visibles.map((i, idx) => {
        const entrando = idx === visibles.length - 1 && visibles.length > 1;
        return (
          <Box key={`${i}-${idx}`} sx={{ position: 'absolute', inset: 0, animation: entrando ? entrada : 'none' }}>
            {/* Foto de fondo, atenuada y respirando (Ken Burns lento) */}
            <Box sx={{
              ...capaFoto(fuente(i)),
              filter: 'brightness(0.42) saturate(0.85)',
              animation: reduceMotion() ? 'none' : `respira ${DURACION_SLIDE + 1500}ms ease-out both`,
              willChange: 'transform',
            }} />
            {/* Un velo de arriba y abajo para que la barra y las acciones siempre lean */}
            <Box sx={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(180deg, ${NOCHE} 0%, transparent 22%, transparent 60%, ${NOCHE} 100%)`,
            }} />
            {/* Mismo encuadre, a pleno, visible solo dentro de las letras */}
            <Box
              aria-hidden
              sx={{
                ...capaFoto(fuente(i)),
                ...CAJA_TITULO,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'brightness(1.35) contrast(1.1)',
                userSelect: 'none', pointerEvents: 'none',
                '@supports not (-webkit-background-clip: text)': { display: 'none' },
              }}
            >
              {texto}
            </Box>
            {/* El filo del corte: una línea lima que acompaña el borde de la foto entrante */}
            {entrando && !reduceMotion() && (
              <Box sx={{
                position: 'absolute', top: '-10%', bottom: '-10%', left: 0, width: 3,
                bgcolor: 'rgba(255,255,255,0.9)',
                boxShadow: '0 0 24px 6px rgba(255,255,255,0.4)',
                animation: `borde-corte ${DURACION_CORTE}ms cubic-bezier(0.76, 0, 0.24, 1) both`,
              }} />
            )}
          </Box>
        );
      })}

      {children}
    </Box>
  );
}
