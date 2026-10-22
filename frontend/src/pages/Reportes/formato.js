/* Formateo y utilidades de fechas de la página Reportes.
   Todo lo que toca fechas trabaja con strings YYYY-MM-DD en hora local:
   nunca pasamos por Date.toISOString() porque corre el día en UTC. */

const pad = (n) => String(n).padStart(2, '0');

export const aISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const hoyISO = () => aISO(new Date());

export function sumarDias(iso, dias) {
  const [y, m, d] = iso.split('-').map(Number);
  const f = new Date(y, m - 1, d + dias);
  return aISO(f);
}

export const esISO = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/* Atajos del selector de período. `rango()` devuelve { desde, hasta }. */
export const ATAJOS = [
  { clave: 'hoy', label: 'Hoy', rango: () => { const h = hoyISO(); return { desde: h, hasta: h }; } },
  { clave: 'semana', label: 'Esta semana', rango: () => {
    const h = new Date(); const dow = (h.getDay() + 6) % 7; // lunes = 0
    return { desde: sumarDias(aISO(h), -dow), hasta: aISO(h) };
  } },
  { clave: 'mes', label: 'Este mes', rango: () => {
    const h = new Date();
    return { desde: aISO(new Date(h.getFullYear(), h.getMonth(), 1)), hasta: aISO(h) };
  } },
  { clave: 'mes-pasado', label: 'Mes pasado', rango: () => {
    const h = new Date();
    return {
      desde: aISO(new Date(h.getFullYear(), h.getMonth() - 1, 1)),
      hasta: aISO(new Date(h.getFullYear(), h.getMonth(), 0)),
    };
  } },
  { clave: '30', label: 'Últimos 30 días', rango: () => ({ desde: sumarDias(hoyISO(), -29), hasta: hoyISO() }) },
  { clave: '90', label: 'Últimos 90 días', rango: () => ({ desde: sumarDias(hoyISO(), -89), hasta: hoyISO() }) },
  { clave: 'anio', label: 'Este año', rango: () => {
    const h = new Date();
    return { desde: aISO(new Date(h.getFullYear(), 0, 1)), hasta: aISO(h) };
  } },
];

/* ── Moneda ── sin decimales cuando el monto es entero, dos cuando no. */
const fmtEntero  = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const fmtDecimal = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function moneda(v) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '—';
  return (Number.isInteger(n) ? fmtEntero : fmtDecimal).format(n);
}

/* Versión compacta para ticks de eje: $0 / $1K / $1,2M */
export function monedaCompacta(v) {
  const n = Number(v ?? 0);
  const abs = Math.abs(n);
  const s = abs >= 1e6 ? `${(n / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`
    : abs >= 1e3 ? `${(n / 1e3).toLocaleString('es-AR', { maximumFractionDigits: abs < 1e4 ? 1 : 0 })}K`
    : n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  return `$${s}`;
}

export const entero = (v) => Number(v ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export function porcentaje(v, { signo = false } = {}) {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  const s = n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
  return `${signo && n > 0 ? '+' : ''}${s} %`;
}

/* ── Fechas para mostrar ── */
export function fechaCorta(iso) {
  if (!esISO(iso)) return iso ?? '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function fechaLarga(iso) {
  if (!esISO(iso)) return iso ?? '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* "2026-10" -> "oct 26" */
export function mesCorto(ym) {
  const m = /^(\d{4})-(\d{2})/.exec(ym ?? '');
  if (!m) return ym ?? '—';
  return `${MESES[Number(m[2]) - 1]} ${m[1].slice(2)}`;
}

export function mesLargo(ym) {
  const m = /^(\d{4})-(\d{2})/.exec(ym ?? '');
  if (!m) return ym ?? '—';
  const nombre = new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

/* "2026-10-22" -> "22/10" (etiqueta de eje) */
export function diaMes(iso) {
  if (!esISO(iso)) return iso ?? '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/* fechaLocal del detalle: viene como string local ("2026-10-22 14:30" o ISO).
   Se formatea por texto para no correr la hora. */
export function fechaHora(v) {
  if (!v) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(v));
  if (m) return `${m[3]}/${m[2]}/${m[1]}${m[4] ? ` ${m[4]}:${m[5]}` : ''}`;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const hora2 = (h) => `${pad(h)} h`;

/* Nombre de archivo: reporte-<gym>-<desde>_<hasta> */
export function slug(texto) {
  return String(texto || 'gym')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'gym';
}

export const nombreArchivo = (gym, desde, hasta, ext) => `reporte-${slug(gym)}-${desde}_${hasta}.${ext}`;

/* Top N + "Otros" para listas largas (planes). */
export function topConOtros(filas, n, { claveMonto = 'monto', claveCantidad = 'cantidad', etiqueta = 'Otros' } = {}) {
  const orden = [...filas].sort((a, b) => Number(b[claveMonto]) - Number(a[claveMonto]));
  if (orden.length <= n) return orden;
  const top = orden.slice(0, n);
  const resto = orden.slice(n);
  const totalMonto = filas.reduce((s, f) => s + Number(f[claveMonto] || 0), 0);
  const montoOtros = resto.reduce((s, f) => s + Number(f[claveMonto] || 0), 0);
  top.push({
    plan: `${etiqueta} (${resto.length})`,
    metodo: etiqueta,
    [claveCantidad]: resto.reduce((s, f) => s + Number(f[claveCantidad] || 0), 0),
    [claveMonto]: montoOtros,
    porcentaje: totalMonto ? (montoOtros / totalMonto) * 100 : 0,
    esOtros: true,
  });
  return top;
}

export const etiquetaMetodo = (m) => {
  const mapa = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta', DEBITO: 'Débito', CREDITO: 'Crédito', MERCADOPAGO: 'Mercado Pago', MERCADO_PAGO: 'Mercado Pago', OTRO: 'Otro' };
  return mapa[m] || (m ? String(m).charAt(0) + String(m).slice(1).toLowerCase() : '—');
};
