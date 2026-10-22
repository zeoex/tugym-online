import { useCallback, useRef, useState, useMemo } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, useTheme } from '@mui/material';

/* Gráficos de la página Reportes, hechos a mano con SVG/CSS siguiendo la skill
   dataviz: marcas finas (<= 24 px), punta redondeada de 4 px y base recta, 2 px
   de aire entre barras, grilla de línea fina sólida, un solo tono por serie
   (info.main validado sobre blanco), texto siempre con tokens de texto y
   tabla gemela accesible detrás de "Ver tabla". */

const GROSOR_MAX = 24;
const GAP = 2;

/* Mide el ancho del contenedor. Es un callback ref (no un useRef + effect)
   porque el nodo se desmonta al pasar a "Ver tabla" y vuelve a montarse
   después: hay que observar cada nodo nuevo, y descartar el 0 que reporta
   el observer cuando el nodo viejo sale del DOM. */
function useAncho() {
  const [ancho, setAncho] = useState(0);
  const observador = useRef(null);
  const setRef = useCallback((el) => {
    if (observador.current) { observador.current.disconnect(); observador.current = null; }
    if (!el) return;
    const medir = () => { if (el.isConnected && el.clientWidth > 0) setAncho(el.clientWidth); };
    medir();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medir);
      observador.current = { disconnect: () => window.removeEventListener('resize', medir) };
      return;
    }
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    observador.current = ro;
  }, []);
  return [setRef, ancho];
}

/* Ticks "redondos" para el eje Y: 0, 5K, 10K... */
function ticksLindos(max, cantidad = 4) {
  if (!(max > 0)) return [0, 1];
  const bruto = max / cantidad;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= bruto) ?? pot * 10;
  const tope = Math.ceil(max / paso) * paso;
  const ticks = [];
  for (let v = 0; v <= tope + paso / 1000; v += paso) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

/* Barra con punta redondeada arriba (r = 4) y base recta, anclada a la línea cero. */
function trazoBarra(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  if (h <= 0 || w <= 0) return '';
  if (r <= 0.5) return `M${x},${y}h${w}v${h}h${-w}Z`;
  return `M${x},${y + r}a${r},${r} 0 0 1 ${r},${-r}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - r}h${-w}Z`;
}

function TablaGemela({ filas, titulos, formatoValor }) {
  return (
    <Box sx={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>{titulos[0]}</TableCell>
            <TableCell align="right">{titulos[1]}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filas.map((f) => (
            <TableRow key={f.clave}>
              <TableCell>{f.etiquetaLarga ?? f.etiqueta}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatoValor(f.valor)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function BotonTabla({ tabla, setTabla }) {
  return (
    <Button size="small" onClick={() => setTabla((t) => !t)} sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 0, px: 1 }}>
      {tabla ? 'Ver gráfico' : 'Ver tabla'}
    </Button>
  );
}

/**
 * Barras verticales (una serie).
 * datos: [{ clave, etiqueta, etiquetaLarga?, valor, detalle? }]
 * resaltados: Set de claves a destacar (el resto queda en gris) — énfasis, no segunda serie.
 */
export function GraficoBarras({
  datos, formatoValor, formatoTick = formatoValor, alto = 220, resaltados = null,
  titulos = ['Fecha', 'Monto'], descripcion, etiquetaDetalle = null, vacio = 'Sin datos en este período',
}) {
  const theme = useTheme();
  const [ref, ancho] = useAncho();
  const [hover, setHover] = useState(null);
  const [tabla, setTabla] = useState(false);

  const colorSerie = theme.palette.info.main;
  const colorApagado = theme.palette.action.disabled;
  const colorGrilla = theme.palette.divider;
  const colorEje = theme.palette.text.disabled;
  const colorTexto = theme.palette.text.secondary;
  const colorTextoFuerte = theme.palette.text.primary;

  const max = useMemo(() => Math.max(0, ...datos.map((d) => Number(d.valor) || 0)), [datos]);
  const ticks = useMemo(() => ticksLindos(max), [max]);
  const tope = ticks[ticks.length - 1] || 1;

  const margen = { arriba: 22, derecha: 8, abajo: 26, izquierda: 48 };
  const anchoPlot = Math.max(0, ancho - margen.izquierda - margen.derecha);
  const altoPlot = alto - margen.arriba - margen.abajo;
  const n = datos.length;
  const banda = n ? anchoPlot / n : 0;
  const grosor = Math.max(1, Math.min(GROSOR_MAX, banda - GAP));
  const pasoEtiqueta = banda > 0 ? Math.max(1, Math.ceil(38 / banda)) : 1;
  const indiceMax = datos.findIndex((d) => Number(d.valor) === max && max > 0);
  const hayDatos = max > 0;

  const y = (v) => margen.arriba + altoPlot - (Number(v) / tope) * altoPlot;

  if (tabla) {
    return (
      <Box>
        <Box display="flex" justifyContent="flex-end"><BotonTabla tabla={tabla} setTabla={setTabla} /></Box>
        <TablaGemela filas={datos} titulos={titulos} formatoValor={formatoValor} />
      </Box>
    );
  }

  const seleccionado = hover != null ? datos[hover] : null;
  const tooltipX = seleccionado ? margen.izquierda + banda * hover + banda / 2 : 0;
  const alineaIzq = tooltipX > ancho / 2;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end"><BotonTabla tabla={tabla} setTabla={setTabla} /></Box>
      <Box ref={ref} sx={{ position: 'relative', width: '100%' }}>
        {ancho > 0 && (
          <svg
            width={ancho} height={alto} role="img"
            aria-label={descripcion || `Gráfico de barras: ${n} valores, máximo ${formatoValor(max)}`}
            style={{ display: 'block', overflow: 'visible', fontFamily: 'inherit' }}
            onMouseLeave={() => setHover(null)}
          >
            {/* Grilla y ticks */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={margen.izquierda} x2={ancho - margen.derecha} y1={y(t)} y2={y(t)}
                  stroke={t === 0 ? colorEje : colorGrilla} strokeWidth={1} shapeRendering="crispEdges" />
                <text x={margen.izquierda - 6} y={y(t) + 3.5} textAnchor="end" fontSize={11} fill={colorTexto}
                  style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatoTick(t)}
                </text>
              </g>
            ))}

            {/* Barras */}
            {datos.map((d, i) => {
              const v = Number(d.valor) || 0;
              const x = margen.izquierda + banda * i + (banda - grosor) / 2;
              const h = (v / tope) * altoPlot;
              const resaltado = resaltados ? resaltados.has(d.clave) : true;
              const activo = hover === i;
              return (
                <g key={d.clave}>
                  {h > 0 && (
                    <path d={trazoBarra(x, y(v), grosor, h)}
                      fill={resaltado ? colorSerie : colorApagado}
                      opacity={hover == null || activo ? 1 : 0.55}
                      style={{ transition: 'opacity 120ms' }} />
                  )}
                  {/* Área de impacto: toda la banda, más grande que la marca */}
                  <rect x={margen.izquierda + banda * i} y={margen.arriba} width={Math.max(banda, 1)} height={altoPlot}
                    fill="transparent" tabIndex={0} aria-label={`${d.etiquetaLarga ?? d.etiqueta}: ${formatoValor(v)}`}
                    style={{ outline: 'none', cursor: 'default' }}
                    onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} />
                  {/* Etiqueta de eje X (salteada si no entra) */}
                  {(i % pasoEtiqueta === 0) && (
                    <text x={margen.izquierda + banda * i + banda / 2} y={alto - 8} textAnchor="middle" fontSize={11} fill={colorTexto}>
                      {d.etiqueta}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Etiqueta directa: solo el máximo */}
            {hayDatos && indiceMax >= 0 && hover == null && (
              <text x={margen.izquierda + banda * indiceMax + banda / 2} y={y(max) - 6} textAnchor="middle"
                fontSize={11.5} fontWeight={700} fill={colorTextoFuerte} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatoValor(max)}
              </text>
            )}

            {!hayDatos && (
              <text x={margen.izquierda + anchoPlot / 2} y={margen.arriba + altoPlot / 2} textAnchor="middle" fontSize={13} fill={colorTexto}>
                {vacio}
              </text>
            )}
          </svg>
        )}

        {seleccionado && (
          <Box
            role="status"
            sx={{
              position: 'absolute', top: 0, pointerEvents: 'none', zIndex: 2,
              ...(alineaIzq ? { right: ancho - tooltipX + 8 } : { left: tooltipX + 8 }),
              bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2,
              boxShadow: 3, px: 1.5, py: 1, minWidth: 120,
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} lineHeight={1.2} sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatoValor(seleccionado.valor)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {seleccionado.etiquetaLarga ?? seleccionado.etiqueta}
            </Typography>
            {etiquetaDetalle && seleccionado.detalle != null && (
              <Typography variant="caption" color="text.secondary" display="block">
                {etiquetaDetalle(seleccionado)}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

/**
 * Barras horizontales (una serie) en HTML: etiqueta | barra | monto · %.
 * filas: [{ clave, etiqueta, valor, porcentaje, secundario? }]
 */
export function BarrasHorizontales({ filas, formatoValor, titulos = ['Categoría', 'Monto'], vacio = 'Sin datos en este período' }) {
  const theme = useTheme();
  const [tabla, setTabla] = useState(false);
  const max = Math.max(0, ...filas.map((f) => Number(f.valor) || 0));

  if (tabla) {
    return (
      <Box>
        <Box display="flex" justifyContent="flex-end"><BotonTabla tabla={tabla} setTabla={setTabla} /></Box>
        <TablaGemela filas={filas} titulos={titulos} formatoValor={formatoValor} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end"><BotonTabla tabla={tabla} setTabla={setTabla} /></Box>
      {filas.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>{vacio}</Typography>
      ) : (
        <Box component="ul" role="list" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {filas.map((f) => {
            const v = Number(f.valor) || 0;
            const ancho = max > 0 ? (v / max) * 100 : 0;
            return (
              <Box component="li" key={f.clave} sx={{ display: 'grid', gridTemplateColumns: { xs: '96px 1fr', sm: '140px 1fr auto' }, alignItems: 'center', columnGap: 1.5, rowGap: 0.25 }}
                aria-label={`${f.etiqueta}: ${formatoValor(v)}${f.porcentaje != null ? `, ${Number(f.porcentaje).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %` : ''}`}>
                <Typography variant="body2" noWrap title={f.etiqueta} sx={{ color: 'text.primary', fontWeight: f.esOtros ? 400 : 500 }}>
                  {f.etiqueta}
                </Typography>
                <Box sx={{ height: 14, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    height: 12, width: `${ancho}%`, minWidth: v > 0 ? 3 : 0,
                    bgcolor: f.esOtros ? theme.palette.action.disabled : theme.palette.info.main,
                    borderRadius: '0 4px 4px 0', transition: 'width 200ms',
                  }} />
                </Box>
                <Typography variant="body2" sx={{ gridColumn: { xs: '2', sm: 'auto' }, fontVariantNumeric: 'tabular-nums', color: 'text.primary', whiteSpace: 'nowrap' }}>
                  <Box component="span" fontWeight={700}>{formatoValor(v)}</Box>
                  {f.porcentaje != null && (
                    <Box component="span" sx={{ color: 'text.secondary' }}> · {Number(f.porcentaje).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %</Box>
                  )}
                  {f.secundario && <Box component="span" sx={{ color: 'text.secondary' }}> · {f.secundario}</Box>}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
