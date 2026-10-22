import { fechaCorta, fechaHora, mesLargo, nombreArchivo, etiquetaMetodo, porcentaje } from './formato';

const FORMATO_MONEDA = '"$"#,##0.00';
const FORMATO_PCT = '0.0"%"';

function descargar(buffer, nombre) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function encabezado(hoja, fila = 1) {
  const r = hoja.getRow(fila);
  r.font = { bold: true };
  r.alignment = { vertical: 'middle' };
  r.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF2EA' } }; });
}

function filaTotales(hoja, valores) {
  const r = hoja.addRow(valores);
  r.font = { bold: true };
  return r;
}

/* Aplica formato de moneda/porcentaje a columnas por clave. */
function formatearColumnas(hoja, { moneda = [], pct = [] }) {
  moneda.forEach((k) => { hoja.getColumn(k).numFmt = FORMATO_MONEDA; });
  pct.forEach((k) => { hoja.getColumn(k).numFmt = FORMATO_PCT; });
}

const num = (v) => (v == null ? null : Number(v));

/**
 * Genera y descarga el libro. `reporte` es la respuesta de GET /api/reportes;
 * `pagos` y `asistencias` son los detalles.
 */
export async function exportarExcel({ gym, reporte, pagos = [], asistencias = [], desde, hasta }) {
  const mod = await import('exceljs');
  const ExcelJS = mod.default?.Workbook ? mod.default : mod;

  const wb = new ExcelJS.Workbook();
  wb.creator = gym || 'TuGymOnLine';
  wb.created = new Date();

  const t = reporte.totales || {};
  const comp = reporte.comparativa || { anterior: {}, variacion: {} };

  /* ── Resumen ── */
  const res = wb.addWorksheet('Resumen');
  res.columns = [{ width: 28 }, { width: 18 }, { width: 18 }, { width: 14 }];
  res.addRow([gym || 'TuGymOnLine']).font = { bold: true, size: 14 };
  res.addRow(['Reporte de recaudación y actividad']);
  res.addRow(['Período', `${fechaCorta(desde)} al ${fechaCorta(hasta)}`, `${reporte.periodo?.dias ?? ''} días`]);
  res.addRow(['Emitido', new Date().toLocaleString('es-AR')]);
  res.addRow([]);
  const cab = res.addRow(['Indicador', 'Período', 'Período anterior', 'Variación']);
  encabezado(res, cab.number);
  const kpis = [
    ['Recaudado', num(t.recaudado), num(comp.anterior?.recaudado), comp.variacion?.recaudado, 'moneda'],
    ['Pagos', num(t.pagos), num(comp.anterior?.pagos), comp.variacion?.pagos],
    ['Ticket promedio', num(t.ticketPromedio), null, null, 'moneda'],
    ['Recargos cobrados', num(t.recargos), null, null, 'moneda'],
    ['Socios que pagaron', num(t.sociosQuePagaron)],
    ['Nuevos socios', num(t.nuevosSocios), num(comp.anterior?.nuevosSocios), comp.variacion?.nuevosSocios],
    ['Asistencias', num(t.asistencias), num(comp.anterior?.asistencias), comp.variacion?.asistencias],
    ['Socios que asistieron', num(t.sociosQueAsistieron)],
    ['Socios activos (hoy)', num(t.sociosActivos)],
    ['Socios vencidos (hoy)', num(t.sociosVencidos)],
  ];
  kpis.forEach(([nombre, v, ant, variacion, tipo]) => {
    const r = res.addRow([nombre, v, ant, variacion == null ? '—' : porcentaje(variacion, { signo: true })]);
    if (tipo === 'moneda') { r.getCell(2).numFmt = FORMATO_MONEDA; r.getCell(3).numFmt = FORMATO_MONEDA; }
    r.getCell(4).alignment = { horizontal: 'right' };
  });

  /* ── Medios de pago ── */
  const mp = wb.addWorksheet('Medios de pago');
  mp.columns = [
    { header: 'Medio de pago', key: 'metodo', width: 22 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Monto', key: 'monto', width: 16 },
    { header: '% del total', key: 'porcentaje', width: 12 },
  ];
  encabezado(mp);
  (reporte.porMedioPago || []).forEach((f) => mp.addRow({ metodo: etiquetaMetodo(f.metodo), cantidad: num(f.cantidad), monto: num(f.monto), porcentaje: num(f.porcentaje) }));
  filaTotales(mp, ['Total', num(t.pagos), num(t.recaudado), (reporte.porMedioPago || []).length ? 100 : null]);
  formatearColumnas(mp, { moneda: ['monto'], pct: ['porcentaje'] });

  /* ── Planes ── */
  const pl = wb.addWorksheet('Planes');
  pl.columns = [
    { header: 'Plan', key: 'plan', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 14 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Monto', key: 'monto', width: 16 },
    { header: '% del total', key: 'porcentaje', width: 12 },
  ];
  encabezado(pl);
  (reporte.porPlan || []).forEach((f) => pl.addRow({ plan: f.plan, tipo: f.tipo, cantidad: num(f.cantidad), monto: num(f.monto), porcentaje: num(f.porcentaje) }));
  filaTotales(pl, ['Total', '', num(t.pagos), num(t.recaudado), (reporte.porPlan || []).length ? 100 : null]);
  if ((reporte.porTipoPlan || []).length) {
    pl.addRow([]);
    const c = pl.addRow(['Por tipo de plan', '', 'Cantidad', 'Monto', '% del total']);
    encabezado(pl, c.number);
    reporte.porTipoPlan.forEach((f) => pl.addRow([f.tipo, '', num(f.cantidad), num(f.monto), num(f.porcentaje)]));
  }
  formatearColumnas(pl, { moneda: ['monto'], pct: ['porcentaje'] });

  /* ── Por día ── */
  const pd = wb.addWorksheet('Por día');
  pd.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Recaudado', key: 'monto', width: 16 },
    { header: 'Pagos', key: 'pagos', width: 10 },
    { header: 'Asistencias', key: 'asistencias', width: 12 },
    { header: 'Nuevos socios', key: 'nuevosSocios', width: 14 },
  ];
  encabezado(pd);
  (reporte.porDia || []).forEach((f) => pd.addRow({ fecha: fechaCorta(f.fecha), monto: num(f.monto), pagos: num(f.pagos), asistencias: num(f.asistencias), nuevosSocios: num(f.nuevosSocios) }));
  filaTotales(pd, ['Total', num(t.recaudado), num(t.pagos), num(t.asistencias), num(t.nuevosSocios)]);
  if ((reporte.porMes || []).length > 1) {
    pd.addRow([]);
    const c = pd.addRow(['Por mes', 'Recaudado', 'Pagos', 'Asistencias']);
    encabezado(pd, c.number);
    reporte.porMes.forEach((f) => pd.addRow([mesLargo(f.mes), num(f.monto), num(f.pagos), num(f.asistencias)]));
  }
  formatearColumnas(pd, { moneda: ['monto'] });

  /* ── Caja ── */
  const cj = wb.addWorksheet('Caja');
  cj.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Apertura', key: 'montoApertura', width: 14 },
    { header: 'Cobrado efectivo', key: 'cobradoEfectivo', width: 16 },
    { header: 'Cobrado total', key: 'cobradoTotal', width: 14 },
    { header: 'Esperado', key: 'esperado', width: 14 },
    { header: 'Cierre', key: 'montoCierre', width: 14 },
    { header: 'Diferencia', key: 'diferencia', width: 14 },
    { header: 'Estado', key: 'estado', width: 12 },
  ];
  encabezado(cj);
  (reporte.caja || []).forEach((f) => cj.addRow({
    fecha: fechaCorta(f.fecha), montoApertura: num(f.montoApertura), cobradoEfectivo: num(f.cobradoEfectivo),
    cobradoTotal: num(f.cobradoTotal), esperado: num(f.esperado), montoCierre: num(f.montoCierre),
    diferencia: num(f.diferencia), estado: f.estado,
  }));
  formatearColumnas(cj, { moneda: ['montoApertura', 'cobradoEfectivo', 'cobradoTotal', 'esperado', 'montoCierre', 'diferencia'] });

  /* ── Pagos (detalle) ── */
  const pg = wb.addWorksheet('Pagos');
  pg.columns = [
    { header: 'Fecha', key: 'fecha', width: 17 },
    { header: 'Socio', key: 'socio', width: 28 },
    { header: 'DNI', key: 'dni', width: 12 },
    { header: 'Plan', key: 'plan', width: 24 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Monto', key: 'monto', width: 14 },
    { header: 'Recargo', key: 'recargo', width: 12 },
    { header: 'Medio de pago', key: 'metodoPago', width: 16 },
    { header: 'Vence', key: 'fechaVencimiento', width: 12 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Observaciones', key: 'observaciones', width: 30 },
  ];
  encabezado(pg);
  pagos.forEach((p) => pg.addRow({
    fecha: fechaHora(p.fechaLocal), socio: p.socio, dni: p.dni, plan: p.plan, tipo: p.tipo,
    monto: num(p.monto), recargo: num(p.recargo), metodoPago: etiquetaMetodo(p.metodoPago),
    fechaVencimiento: p.fechaVencimiento ? fechaCorta(String(p.fechaVencimiento).slice(0, 10)) : '',
    estado: p.estado, observaciones: p.observaciones || '',
  }));
  filaTotales(pg, ['Total', `${pagos.length} pagos`, '', '', '',
    pagos.reduce((s, p) => s + Number(p.monto || 0), 0),
    pagos.reduce((s, p) => s + Number(p.recargo || 0), 0)]);
  formatearColumnas(pg, { moneda: ['monto', 'recargo'] });
  pg.views = [{ state: 'frozen', ySplit: 1 }];

  /* ── Asistencias (detalle) ── */
  const as = wb.addWorksheet('Asistencias');
  as.columns = [
    { header: 'Fecha', key: 'fecha', width: 17 },
    { header: 'Socio', key: 'socio', width: 28 },
    { header: 'DNI', key: 'dni', width: 12 },
    { header: 'Tipo', key: 'tipo', width: 10 },
    { header: 'Cuota vencida', key: 'cuotaVencida', width: 14 },
  ];
  encabezado(as);
  asistencias.forEach((a) => as.addRow({ fecha: fechaHora(a.fechaLocal), socio: a.socio, dni: a.dni, tipo: a.tipo, cuotaVencida: a.cuotaVencida ? 'Sí' : 'No' }));
  filaTotales(as, ['Total', `${asistencias.length} asistencias`]);
  as.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  descargar(buffer, nombreArchivo(gym, desde, hasta, 'xlsx'));
}
