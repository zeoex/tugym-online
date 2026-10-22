import { INK, ACENTO } from '../../theme';
import { moneda, entero, fechaCorta, fechaHora, mesLargo, nombreArchivo, etiquetaMetodo, porcentaje } from './formato';

const hexARgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const TINTA = hexARgb(INK);
const LIMA = hexARgb(ACENTO);

/* jsPDF con helvetica estándar no trae guion largo ni flechas: usamos ASCII. */
const guion = (s) => String(s ?? '').replace(/—/g, '-').replace(/–/g, '-');
const variacion = (v) => (v == null ? '-' : guion(porcentaje(v, { signo: true })));

export async function exportarPdf({ gym, reporte, pagos = [], desde, hasta }) {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const ANCHO = doc.internal.pageSize.getWidth();
  const ALTO = doc.internal.pageSize.getHeight();
  const M = 14;
  const nombre = gym || 'TuGymOnLine';
  const t = reporte.totales || {};
  const comp = reporte.comparativa || { anterior: {}, variacion: {} };

  const HEAD = { fillColor: TINTA, textColor: 255, fontStyle: 'bold' };
  const estilos = { fontSize: 9, cellPadding: 1.8, textColor: TINTA };
  const alt = { fillColor: [245, 247, 242] };
  const der = { halign: 'right' };

  /* ── Encabezado de la primera página ── */
  doc.setFillColor(...TINTA);
  doc.rect(0, 0, ANCHO, 30, 'F');
  doc.setFillColor(...LIMA);
  doc.rect(0, 30, ANCHO, 1.2, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
  doc.text(guion(nombre), M, 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text('Reporte de recaudación y actividad', M, 20);
  doc.setFontSize(9);
  doc.text(`Período: ${fechaCorta(desde)} al ${fechaCorta(hasta)} (${reporte.periodo?.dias ?? ''} días)`, M, 26);
  doc.text(`Emitido: ${new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, ANCHO - M, 26, { align: 'right' });
  doc.setTextColor(...TINTA);

  /* ── KPIs ── */
  let y = 38;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Indicadores', M, y);
  autoTable(doc, {
    startY: y + 3,
    head: [['Indicador', 'Período', 'Período anterior', 'Variación']],
    body: [
      ['Recaudado', moneda(t.recaudado), moneda(comp.anterior?.recaudado), variacion(comp.variacion?.recaudado)],
      ['Pagos', entero(t.pagos), entero(comp.anterior?.pagos), variacion(comp.variacion?.pagos)],
      ['Ticket promedio', moneda(t.ticketPromedio), '-', '-'],
      ['Recargos cobrados', moneda(t.recargos), '-', '-'],
      ['Socios que pagaron', entero(t.sociosQuePagaron), '-', '-'],
      ['Nuevos socios', entero(t.nuevosSocios), entero(comp.anterior?.nuevosSocios), variacion(comp.variacion?.nuevosSocios)],
      ['Asistencias', entero(t.asistencias), entero(comp.anterior?.asistencias), variacion(comp.variacion?.asistencias)],
      ['Socios que asistieron', entero(t.sociosQueAsistieron), '-', '-'],
      ['Socios activos / vencidos hoy', `${entero(t.sociosActivos)} / ${entero(t.sociosVencidos)}`, '-', '-'],
    ],
    styles: estilos, headStyles: HEAD, alternateRowStyles: alt,
    columnStyles: { 1: der, 2: der, 3: der },
    margin: { left: M, right: M },
  });

  const seccion = (titulo) => {
    let yy = doc.lastAutoTable.finalY + 9;
    if (yy > ALTO - 40) { doc.addPage(); yy = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text(titulo, M, yy);
    return yy + 3;
  };

  /* ── Medios de pago ── */
  const medios = reporte.porMedioPago || [];
  autoTable(doc, {
    startY: seccion('Medios de pago'),
    head: [['Medio de pago', 'Cantidad', 'Monto', '% del total']],
    body: medios.length
      ? medios.map((f) => [etiquetaMetodo(f.metodo), entero(f.cantidad), moneda(f.monto), guion(porcentaje(f.porcentaje))])
      : [['Sin pagos en el período', '', '', '']],
    foot: medios.length ? [['Total', entero(t.pagos), moneda(t.recaudado), '100 %']] : undefined,
    styles: estilos, headStyles: HEAD, alternateRowStyles: alt,
    footStyles: { fillColor: [239, 242, 234], textColor: TINTA, fontStyle: 'bold' },
    columnStyles: { 1: der, 2: der, 3: der }, margin: { left: M, right: M },
  });

  /* ── Planes ── */
  const planes = reporte.porPlan || [];
  autoTable(doc, {
    startY: seccion('Planes'),
    head: [['Plan', 'Tipo', 'Cantidad', 'Monto', '% del total']],
    body: planes.length
      ? planes.map((f) => [f.plan, f.tipo, entero(f.cantidad), moneda(f.monto), guion(porcentaje(f.porcentaje))])
      : [['Sin pagos en el período', '', '', '', '']],
    foot: planes.length ? [['Total', '', entero(t.pagos), moneda(t.recaudado), '100 %']] : undefined,
    styles: estilos, headStyles: HEAD, alternateRowStyles: alt,
    footStyles: { fillColor: [239, 242, 234], textColor: TINTA, fontStyle: 'bold' },
    columnStyles: { 2: der, 3: der, 4: der }, margin: { left: M, right: M },
  });

  /* ── Por día o por mes ── */
  const largo = (reporte.periodo?.dias ?? 0) > 62;
  const serie = largo ? (reporte.porMes || []) : (reporte.porDia || []);
  autoTable(doc, {
    startY: seccion(largo ? 'Recaudación por mes' : 'Recaudación por día'),
    head: [[largo ? 'Mes' : 'Fecha', 'Recaudado', 'Pagos', 'Asistencias', ...(largo ? [] : ['Nuevos socios'])]],
    body: serie.length
      ? serie.map((f) => [
        largo ? mesLargo(f.mes) : fechaCorta(f.fecha), moneda(f.monto), entero(f.pagos), entero(f.asistencias),
        ...(largo ? [] : [entero(f.nuevosSocios)]),
      ])
      : [['Sin datos', '', '', '', ...(largo ? [] : [''])]],
    foot: serie.length ? [['Total', moneda(t.recaudado), entero(t.pagos), entero(t.asistencias), ...(largo ? [] : [entero(t.nuevosSocios)])]] : undefined,
    styles: estilos, headStyles: HEAD, alternateRowStyles: alt,
    footStyles: { fillColor: [239, 242, 234], textColor: TINTA, fontStyle: 'bold' },
    columnStyles: { 1: der, 2: der, 3: der, 4: der }, margin: { left: M, right: M },
  });

  /* ── Caja ── */
  const caja = reporte.caja || [];
  autoTable(doc, {
    startY: seccion('Caja por día'),
    head: [['Fecha', 'Apertura', 'Cobrado efectivo', 'Esperado', 'Cierre', 'Diferencia', 'Estado']],
    body: caja.length
      ? caja.map((f) => [
        fechaCorta(f.fecha), moneda(f.montoApertura), moneda(f.cobradoEfectivo), moneda(f.esperado),
        f.montoCierre == null ? '-' : moneda(f.montoCierre), f.diferencia == null ? '-' : moneda(f.diferencia), f.estado || '-',
      ])
      : [['Sin cajas en el período', '', '', '', '', '', '']],
    styles: estilos, headStyles: HEAD, alternateRowStyles: alt,
    columnStyles: { 1: der, 2: der, 3: der, 4: der, 5: der }, margin: { left: M, right: M },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5 && caja[data.row.index]) {
        const d = Number(caja[data.row.index].diferencia);
        if (Number.isFinite(d) && d !== 0) { data.cell.styles.textColor = d < 0 ? [220, 38, 38] : [217, 119, 6]; data.cell.styles.fontStyle = 'bold'; }
      }
    },
  });

  /* ── Detalle de pagos (páginas siguientes) ── */
  doc.addPage();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(`Detalle de pagos (${pagos.length})`, M, 20);
  autoTable(doc, {
    startY: 23,
    head: [['Fecha', 'Socio', 'DNI', 'Plan', 'Monto', 'Recargo', 'Medio', 'Vence']],
    body: pagos.length
      ? pagos.map((p) => [
        fechaHora(p.fechaLocal), p.socio, p.dni, p.plan, moneda(p.monto),
        Number(p.recargo) ? moneda(p.recargo) : '-', etiquetaMetodo(p.metodoPago),
        p.fechaVencimiento ? fechaCorta(String(p.fechaVencimiento).slice(0, 10)) : '-',
      ])
      : [['No hay pagos en este período', '', '', '', '', '', '', '']],
    foot: pagos.length ? [['Total', `${pagos.length} pagos`, '', '', moneda(pagos.reduce((s, p) => s + Number(p.monto || 0), 0)),
      moneda(pagos.reduce((s, p) => s + Number(p.recargo || 0), 0)), '', '']] : undefined,
    styles: { ...estilos, fontSize: 8, cellPadding: 1.5 }, headStyles: HEAD, alternateRowStyles: alt,
    footStyles: { fillColor: [239, 242, 234], textColor: TINTA, fontStyle: 'bold' },
    columnStyles: { 4: der, 5: der }, margin: { left: M, right: M, top: 18, bottom: 16 },
    showFoot: 'lastPage',
  });

  /* ── Pie: "Página X de Y" ── */
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120);
    doc.text(`${guion(nombre)} - Reporte ${fechaCorta(desde)} al ${fechaCorta(hasta)}`, M, ALTO - 8);
    doc.text(`Página ${i} de ${total}`, ANCHO - M, ALTO - 8, { align: 'right' });
  }

  doc.save(nombreArchivo(gym, desde, hasta, 'pdf'));
}
