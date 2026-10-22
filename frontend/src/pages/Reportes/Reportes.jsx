import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Paper, Chip, TextField, Button, Menu, MenuItem, ListItemIcon, ListItemText,
  Grid, Skeleton, Alert, Snackbar, CircularProgress, Tabs, Tab, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import TableViewIcon from '@mui/icons-material/TableView';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import api from '../../services/api';
import { GraficoBarras, BarrasHorizontales } from './graficos';
import DetalleTabla from './DetalleTabla';
import {
  ATAJOS, esISO, moneda, monedaCompacta, entero, porcentaje, fechaCorta, fechaLarga, fechaHora,
  mesCorto, mesLargo, diaMes, hora2, topConOtros, etiquetaMetodo,
} from './formato';

const atajoPorDefecto = () => ATAJOS.find((a) => a.clave === 'mes').rango();

/* ── Indicador (stat tile) ── */
function Indicador({ etiqueta, valor, variacion, neutro = false, cargando }) {
  let color = 'text.secondary';
  let Icono = null;
  if (variacion != null && Number(variacion) !== 0) {
    const sube = Number(variacion) > 0;
    Icono = sube ? ArrowUpwardIcon : ArrowDownwardIcon;
    if (!neutro) color = sube ? 'success.main' : 'error.main';
  }
  return (
    <Paper sx={{ p: { xs: 1.75, sm: 2.25 }, height: '100%', opacity: cargando ? 0.55 : 1, transition: 'opacity 150ms' }}>
      <Typography variant="body2" color="text.secondary" noWrap>{etiqueta}</Typography>
      <Typography variant="h4" fontWeight={700} lineHeight={1.15} mt={0.5} sx={{ fontSize: { xs: 24, sm: 30 }, wordBreak: 'break-word' }}>
        {valor}
      </Typography>
      <Box display="flex" alignItems="center" gap={0.5} mt={0.75} sx={{ color }}>
        {Icono && <Icono sx={{ fontSize: 15 }} aria-hidden />}
        <Typography variant="caption" fontWeight={700} sx={{ color: 'inherit', whiteSpace: 'nowrap' }}>
          {variacion == null ? '—' : porcentaje(variacion, { signo: true })}
        </Typography>
        <Typography variant="caption" color="text.secondary">vs. período anterior</Typography>
      </Box>
    </Paper>
  );
}

function Seccion({ titulo, subtitulo, children, accion }) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} mb={1}>
        <Box>
          <Typography variant="h6" fontSize={18}>{titulo}</Typography>
          {subtitulo && <Typography variant="caption" color="text.secondary">{subtitulo}</Typography>}
        </Box>
        {accion}
      </Box>
      {children}
    </Paper>
  );
}

const ChipEstado = ({ estado }) => (
  <Chip size="small" label={estado || '—'} variant="outlined"
    color={estado === 'CERRADA' ? 'default' : estado === 'ABIERTA' ? 'success' : 'default'} />
);

export default function Reportes() {
  const [params, setParams] = useSearchParams();
  const desde = params.get('desde');
  const hasta = params.get('hasta');
  const rangoValido = esISO(desde) && esISO(hasta) && desde <= hasta;

  const [gym, setGym] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [detalle, setDetalle] = useState({ pagos: null, asistencias: null });
  const [cargandoDetalle, setCargandoDetalle] = useState({ pagos: false, asistencias: false });
  const [errorDetalle, setErrorDetalle] = useState({ pagos: '', asistencias: '' });
  const [menuExportar, setMenuExportar] = useState(null);
  const [exportando, setExportando] = useState(null);
  const [aviso, setAviso] = useState('');

  /* Sin rango en la URL: este mes (y se escribe en la URL para poder compartir). */
  useEffect(() => {
    if (!esISO(desde) || !esISO(hasta)) setParams(atajoPorDefecto(), { replace: true });
  }, [desde, hasta, setParams]);

  useEffect(() => {
    api.get('/config').then((r) => setGym(r.data?.nombreGym || '')).catch(() => {});
  }, []);

  const cargar = useCallback(async () => {
    if (!rangoValido) return;
    setCargando(true); setError('');
    try {
      const r = await api.get('/reportes', { params: { desde, hasta } });
      setDatos(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo cargar el reporte');
    } finally { setCargando(false); }
  }, [desde, hasta, rangoValido]);

  useEffect(() => {
    setDetalle({ pagos: null, asistencias: null });
    setErrorDetalle({ pagos: '', asistencias: '' });
    cargar();
  }, [cargar]);

  const cargarDetalle = useCallback(async (tipo) => {
    if (!rangoValido) return null;
    setCargandoDetalle((p) => ({ ...p, [tipo]: true }));
    setErrorDetalle((p) => ({ ...p, [tipo]: '' }));
    try {
      const r = await api.get(`/reportes/${tipo}`, { params: { desde, hasta } });
      setDetalle((p) => ({ ...p, [tipo]: r.data }));
      return r.data;
    } catch (e) {
      setErrorDetalle((p) => ({ ...p, [tipo]: e.response?.data?.error || `No se pudo cargar el detalle de ${tipo}` }));
      throw e;
    } finally { setCargandoDetalle((p) => ({ ...p, [tipo]: false })); }
  }, [desde, hasta, rangoValido]);

  /* Las pestañas de detalle se cargan al abrirlas, una sola vez por período. */
  useEffect(() => {
    const tipo = tab === 0 ? 'pagos' : 'asistencias';
    if (detalle[tipo] == null && !cargandoDetalle[tipo] && !errorDetalle[tipo]) cargarDetalle(tipo).catch(() => {});
  }, [tab, detalle, cargandoDetalle, errorDetalle, cargarDetalle]);

  const setRango = (r) => setParams(r);
  const atajoActivo = useMemo(() => ATAJOS.find((a) => { const r = a.rango(); return r.desde === desde && r.hasta === hasta; })?.clave, [desde, hasta]);

  /* ── Derivados para los gráficos ── */
  const t = datos?.totales;
  const comp = datos?.comparativa?.variacion || {};
  const dias = datos?.periodo?.dias ?? 0;
  const largo = dias > 62;
  const serieRecaudacion = useMemo(() => {
    if (!datos) return [];
    return largo
      ? (datos.porMes || []).map((m) => ({ clave: m.mes, etiqueta: mesCorto(m.mes), etiquetaLarga: mesLargo(m.mes), valor: m.monto, detalle: m.pagos }))
      : (datos.porDia || []).map((d) => ({ clave: d.fecha, etiqueta: diaMes(d.fecha), etiquetaLarga: fechaLarga(d.fecha), valor: d.monto, detalle: d.pagos }));
  }, [datos, largo]);

  const medios = useMemo(() => (datos?.porMedioPago || []).map((m) => ({
    clave: m.metodo, etiqueta: etiquetaMetodo(m.metodo), valor: m.monto, porcentaje: m.porcentaje, secundario: `${entero(m.cantidad)} ${Number(m.cantidad) === 1 ? 'pago' : 'pagos'}`,
  })), [datos]);

  const planes = useMemo(() => topConOtros(datos?.porPlan || [], 8).map((p) => ({
    clave: p.esOtros ? 'otros' : p.planId, etiqueta: p.plan, valor: p.monto, porcentaje: p.porcentaje, esOtros: p.esOtros,
    secundario: `${entero(p.cantidad)} ${Number(p.cantidad) === 1 ? 'pago' : 'pagos'}`,
  })), [datos]);

  const horas = useMemo(() => {
    const base = Array.from({ length: 24 }, (_, h) => ({ hora: h, asistencias: 0 }));
    (datos?.porHora || []).forEach((p) => { if (base[p.hora]) base[p.hora].asistencias = Number(p.asistencias) || 0; });
    return base.map((h) => ({ clave: h.hora, etiqueta: String(h.hora), etiquetaLarga: `${hora2(h.hora)} a ${hora2((h.hora + 1) % 24)}`, valor: h.asistencias }));
  }, [datos]);
  const horasPico = useMemo(() => {
    const max = Math.max(0, ...horas.map((h) => h.valor));
    if (!max) return new Set();
    return new Set(horas.filter((h) => h.valor > 0 && h.valor >= max * 0.7).map((h) => h.clave));
  }, [horas]);

  const sinPagos = datos && Number(t?.pagos) === 0;

  /* ── Exportar ── */
  const exportar = async (tipo) => {
    setMenuExportar(null);
    if (!datos) return;
    setExportando(tipo);
    try {
      const pagos = detalle.pagos ?? await cargarDetalle('pagos');
      const base = { gym: gym || 'Torino Fitness', reporte: datos, pagos: pagos || [], desde, hasta };
      if (tipo === 'excel') {
        const asistencias = detalle.asistencias ?? await cargarDetalle('asistencias');
        const { exportarExcel } = await import('./exportarExcel');
        await exportarExcel({ ...base, asistencias: asistencias || [] });
      } else {
        const { exportarPdf } = await import('./exportarPdf');
        await exportarPdf(base);
      }
    } catch (e) {
      setAviso(e.response?.data?.error || e.message || `No se pudo exportar a ${tipo === 'excel' ? 'Excel' : 'PDF'}`);
    } finally { setExportando(null); }
  };

  const cargandoInicial = cargando && !datos;

  return (
    <Box>
      {/* Encabezado */}
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap" mb={2.5}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: 'secondary.main', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AssessmentIcon />
          </Box>
          <Box>
            <Typography variant="h5">Reportes</Typography>
            <Typography variant="body2" color="text.secondary">Recaudación y actividad por período</Typography>
          </Box>
        </Box>
        <Button
          variant="contained" onClick={(e) => setMenuExportar(e.currentTarget)}
          disabled={!datos || !!exportando || !!error}
          startIcon={exportando ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          aria-haspopup="menu"
        >
          {exportando ? `Exportando ${exportando === 'excel' ? 'Excel' : 'PDF'}...` : 'Exportar'}
        </Button>
        <Menu anchorEl={menuExportar} open={Boolean(menuExportar)} onClose={() => setMenuExportar(null)}>
          <MenuItem onClick={() => exportar('excel')}>
            <ListItemIcon><TableViewIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Excel (.xlsx)" secondary="Resumen, tablas y detalle" />
          </MenuItem>
          <MenuItem onClick={() => exportar('pdf')}>
            <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="PDF" secondary="Resumen con detalle de pagos" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Selector de período: una sola fila arriba de todo lo que filtra */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          {ATAJOS.map((a) => (
            <Chip
              key={a.clave} label={a.label} clickable onClick={() => setRango(a.rango())}
              color={atajoActivo === a.clave ? 'primary' : 'default'}
              variant={atajoActivo === a.clave ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            type="date" label="Desde" value={desde || ''} onChange={(e) => e.target.value && setRango({ desde: e.target.value, hasta: hasta || e.target.value })}
            InputLabelProps={{ shrink: true }} sx={{ width: { xs: 'calc(50% - 6px)', sm: 170 } }}
            error={esISO(desde) && esISO(hasta) && desde > hasta}
          />
          <TextField
            type="date" label="Hasta" value={hasta || ''} onChange={(e) => e.target.value && setRango({ desde: desde || e.target.value, hasta: e.target.value })}
            InputLabelProps={{ shrink: true }} sx={{ width: { xs: 'calc(50% - 6px)', sm: 170 } }}
            error={esISO(desde) && esISO(hasta) && desde > hasta}
          />
          <Typography variant="body2" color={rangoValido ? 'text.secondary' : 'error.main'}>
            {rangoValido
              ? `${fechaCorta(desde)} al ${fechaCorta(hasta)}${datos?.periodo?.dias ? ` · ${datos.periodo.dias} ${datos.periodo.dias === 1 ? 'día' : 'días'}` : ''}`
              : 'El inicio no puede ser posterior al fin'}
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={cargar}>Reintentar</Button>}>
          {error}
        </Alert>
      )}

      {/* Indicadores */}
      <Grid container spacing={2} mb={3}>
        {cargandoInicial ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={112} /></Grid>
          ))
        ) : (
          [
            { etiqueta: 'Recaudado', valor: moneda(t?.recaudado), variacion: comp.recaudado },
            { etiqueta: 'Pagos', valor: entero(t?.pagos), variacion: comp.pagos },
            { etiqueta: 'Ticket promedio', valor: moneda(t?.ticketPromedio), variacion: null },
            { etiqueta: 'Recargos cobrados', valor: moneda(t?.recargos), variacion: null, neutro: true },
            { etiqueta: 'Nuevos socios', valor: entero(t?.nuevosSocios), variacion: comp.nuevosSocios },
            { etiqueta: 'Asistencias', valor: entero(t?.asistencias), variacion: comp.asistencias },
          ].map((k) => (
            <Grid item xs={6} sm={4} md={2} key={k.etiqueta}>
              <Indicador {...k} cargando={cargando} />
            </Grid>
          ))
        )}
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={2} mb={3} sx={{ opacity: cargando && datos ? 0.55 : 1, transition: 'opacity 150ms' }}>
        <Grid item xs={12}>
          <Seccion titulo={largo ? 'Recaudación por mes' : 'Recaudación por día'} subtitulo={largo ? 'Rango mayor a 62 días: se agrupa por mes' : 'Monto cobrado cada día del período'}>
            {cargandoInicial ? <Skeleton variant="rounded" height={220} /> : (
              <GraficoBarras
                datos={serieRecaudacion} formatoValor={moneda} formatoTick={monedaCompacta}
                titulos={[largo ? 'Mes' : 'Fecha', 'Recaudado']}
                etiquetaDetalle={(d) => `${entero(d.detalle)} ${Number(d.detalle) === 1 ? 'pago' : 'pagos'}`}
                vacio={sinPagos ? 'No hay pagos en este período' : 'Sin datos'}
                descripcion={`Recaudación ${largo ? 'por mes' : 'por día'} entre ${fechaCorta(desde)} y ${fechaCorta(hasta)}; total ${moneda(t?.recaudado)}`}
              />
            )}
          </Seccion>
        </Grid>
        <Grid item xs={12} md={6}>
          <Seccion titulo="Medios de pago" subtitulo="Monto cobrado por medio y participación">
            {cargandoInicial ? <Skeleton variant="rounded" height={160} /> : (
              <BarrasHorizontales filas={medios} formatoValor={moneda} titulos={['Medio de pago', 'Monto']} vacio="No hay pagos en este período" />
            )}
          </Seccion>
        </Grid>
        <Grid item xs={12} md={6}>
          <Seccion titulo="Por plan" subtitulo={(datos?.porPlan?.length ?? 0) > 8 ? 'Los 8 planes principales; el resto agrupado en Otros' : 'Monto cobrado por plan'}>
            {cargandoInicial ? <Skeleton variant="rounded" height={160} /> : (
              <BarrasHorizontales filas={planes} formatoValor={moneda} titulos={['Plan', 'Monto']} vacio="No hay pagos en este período" />
            )}
          </Seccion>
        </Grid>
        <Grid item xs={12}>
          <Seccion
            titulo="Asistencias por hora"
            subtitulo={horasPico.size
              ? `Horas pico resaltadas (70 % o más del máximo): ${[...horasPico].map((h) => `${h} h`).join(', ')}`
              : 'Check-ins agrupados por hora de ingreso'}
          >
            {cargandoInicial ? <Skeleton variant="rounded" height={200} /> : (
              <GraficoBarras
                datos={horas} formatoValor={(v) => `${entero(v)} ${Number(v) === 1 ? 'asistencia' : 'asistencias'}`}
                formatoTick={entero} alto={200} resaltados={horasPico} titulos={['Hora', 'Asistencias']}
                vacio="No hay asistencias en este período"
                descripcion={`Asistencias por hora del día; total ${entero(t?.asistencias)}`}
              />
            )}
          </Seccion>
        </Grid>
      </Grid>

      {/* Tablas resumen */}
      <Grid container spacing={2} mb={3} sx={{ opacity: cargando && datos ? 0.55 : 1, transition: 'opacity 150ms' }}>
        <Grid item xs={12} md={6}>
          <TablaMedios filas={datos?.porMedioPago} totales={t} cargando={cargandoInicial} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TablaTipoPlan filas={datos?.porTipoPlan} totales={t} cargando={cargandoInicial} />
        </Grid>
        <Grid item xs={12}>
          <TablaPlanes filas={datos?.porPlan} totales={t} cargando={cargandoInicial} />
        </Grid>
        <Grid item xs={12}>
          <TablaCaja filas={datos?.caja} cargando={cargandoInicial} />
        </Grid>
      </Grid>

      {/* Detalle */}
      <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" allowScrollButtonsMobile>
          <Tab label={`Detalle de pagos${t ? ` (${entero(t.pagos)})` : ''}`} />
          <Tab label={`Detalle de asistencias${t ? ` (${entero(t.asistencias)})` : ''}`} />
        </Tabs>
        {tab === 0 ? (
          <DetalleTabla
            filas={detalle.pagos || []} cargando={cargandoDetalle.pagos || (detalle.pagos == null && !errorDetalle.pagos)}
            error={errorDetalle.pagos} onReintentar={() => cargarDetalle('pagos').catch(() => {})}
            vacio="No hay pagos en este período"
            textoBusqueda={(p) => `${p.socio} ${p.dni} ${p.plan} ${p.tipo} ${p.metodoPago} ${p.estado} ${p.observaciones || ''}`}
            resumen={(f) => `${entero(f.length)} ${f.length === 1 ? 'pago' : 'pagos'} · ${moneda(f.reduce((s, p) => s + Number(p.monto || 0), 0))}`}
            columnas={[
              { clave: 'fechaLocal', titulo: 'Fecha', render: (p) => fechaHora(p.fechaLocal) },
              { clave: 'socio', titulo: 'Socio', render: (p) => (<><Typography variant="body2" fontWeight={600}>{p.socio}</Typography><Typography variant="caption" color="text.secondary">DNI {p.dni}</Typography></>) },
              { clave: 'plan', titulo: 'Plan', render: (p) => (<>{p.plan}{p.tipo && <Typography variant="caption" color="text.secondary" display="block">{p.tipo}</Typography>}</>) },
              { clave: 'monto', titulo: 'Monto', align: 'right', render: (p) => <Typography variant="body2" fontWeight={700}>{moneda(p.monto)}</Typography> },
              { clave: 'recargo', titulo: 'Recargo', align: 'right', render: (p) => (Number(p.recargo) ? moneda(p.recargo) : '—') },
              { clave: 'metodoPago', titulo: 'Medio', render: (p) => etiquetaMetodo(p.metodoPago) },
              { clave: 'fechaVencimiento', titulo: 'Vence', render: (p) => (p.fechaVencimiento ? fechaCorta(String(p.fechaVencimiento).slice(0, 10)) : '—') },
              { clave: 'estado', titulo: 'Estado', render: (p) => <Chip size="small" label={p.estado || '—'} variant="outlined" color={p.estado === 'ACTIVO' || p.estado === 'VIGENTE' ? 'success' : p.estado === 'VENCIDO' ? 'error' : 'default'} /> },
            ]}
          />
        ) : (
          <DetalleTabla
            filas={detalle.asistencias || []} cargando={cargandoDetalle.asistencias || (detalle.asistencias == null && !errorDetalle.asistencias)}
            error={errorDetalle.asistencias} onReintentar={() => cargarDetalle('asistencias').catch(() => {})}
            vacio="No hay asistencias en este período"
            textoBusqueda={(a) => `${a.socio} ${a.dni} ${a.tipo} ${a.cuotaVencida ? 'vencida' : ''}`}
            resumen={(f) => `${entero(f.length)} ${f.length === 1 ? 'asistencia' : 'asistencias'} · ${entero(f.filter((a) => a.cuotaVencida).length)} con cuota vencida`}
            columnas={[
              { clave: 'fechaLocal', titulo: 'Fecha', render: (a) => fechaHora(a.fechaLocal) },
              { clave: 'socio', titulo: 'Socio', render: (a) => (<><Typography variant="body2" fontWeight={600}>{a.socio}</Typography><Typography variant="caption" color="text.secondary">DNI {a.dni}</Typography></>) },
              { clave: 'tipo', titulo: 'Tipo', render: (a) => <Chip size="small" variant="outlined" label={a.tipo === 'GEO' ? 'GPS' : a.tipo === 'MANUAL' ? 'Recepción' : a.tipo || '—'} /> },
              { clave: 'cuotaVencida', titulo: 'Cuota', render: (a) => (a.cuotaVencida ? <Chip size="small" color="warning" label="Vencida" /> : <Chip size="small" variant="outlined" color="success" label="Al día" />) },
            ]}
          />
        )}
      </Paper>

      <Snackbar open={Boolean(aviso)} autoHideDuration={6000} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setAviso('')} variant="filled">{aviso}</Alert>
      </Snackbar>
    </Box>
  );
}

/* ── Tablas resumen ── */
function CuerpoCargando({ columnas }) {
  return Array.from({ length: 3 }).map((_, i) => (
    <TableRow key={i}>{Array.from({ length: columnas }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
  ));
}

const FilaVacia = ({ columnas, texto }) => (
  <TableRow><TableCell colSpan={columnas} align="center" sx={{ py: 3, color: 'text.secondary' }}>{texto}</TableCell></TableRow>
);

const celdaNum = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

function TablaMedios({ filas, totales, cargando }) {
  return (
    <TableContainer component={Paper}>
      <Box px={2} pt={2} pb={1}><Typography variant="h6" fontSize={18}>Medios de pago</Typography></Box>
      <Table size="small" sx={{ minWidth: 360 }}>
        <TableHead><TableRow><TableCell>Medio</TableCell><TableCell align="right">Pagos</TableCell><TableCell align="right">Monto</TableCell><TableCell align="right">%</TableCell></TableRow></TableHead>
        <TableBody>
          {cargando ? <CuerpoCargando columnas={4} /> : !filas?.length ? <FilaVacia columnas={4} texto="No hay pagos en este período" /> : (
            <>
              {filas.map((f) => (
                <TableRow key={f.metodo} hover>
                  <TableCell>{etiquetaMetodo(f.metodo)}</TableCell>
                  <TableCell align="right" sx={celdaNum}>{entero(f.cantidad)}</TableCell>
                  <TableCell align="right" sx={celdaNum}>{moneda(f.monto)}</TableCell>
                  <TableCell align="right" sx={celdaNum}>{porcentaje(f.porcentaje)}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'background.default' } }}>
                <TableCell>Total</TableCell>
                <TableCell align="right" sx={celdaNum}>{entero(totales?.pagos)}</TableCell>
                <TableCell align="right" sx={celdaNum}>{moneda(totales?.recaudado)}</TableCell>
                <TableCell align="right" sx={celdaNum}>100 %</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TablaTipoPlan({ filas, totales, cargando }) {
  return (
    <TableContainer component={Paper}>
      <Box px={2} pt={2} pb={1}><Typography variant="h6" fontSize={18}>Tipo de plan</Typography></Box>
      <Table size="small" sx={{ minWidth: 360 }}>
        <TableHead><TableRow><TableCell>Tipo</TableCell><TableCell align="right">Pagos</TableCell><TableCell align="right">Monto</TableCell><TableCell align="right">%</TableCell></TableRow></TableHead>
        <TableBody>
          {cargando ? <CuerpoCargando columnas={4} /> : !filas?.length ? <FilaVacia columnas={4} texto="No hay pagos en este período" /> : (
            <>
              {filas.map((f) => (
                <TableRow key={f.tipo} hover>
                  <TableCell>{f.tipo}</TableCell>
                  <TableCell align="right" sx={celdaNum}>{entero(f.cantidad)}</TableCell>
                  <TableCell align="right" sx={celdaNum}>{moneda(f.monto)}</TableCell>
                  <TableCell align="right" sx={celdaNum}>{porcentaje(f.porcentaje)}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'background.default' } }}>
                <TableCell>Total</TableCell>
                <TableCell align="right" sx={celdaNum}>{entero(totales?.pagos)}</TableCell>
                <TableCell align="right" sx={celdaNum}>{moneda(totales?.recaudado)}</TableCell>
                <TableCell align="right" sx={celdaNum}>100 %</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TablaPlanes({ filas, totales, cargando }) {
  return (
    <TableContainer component={Paper}>
      <Box px={2} pt={2} pb={1}><Typography variant="h6" fontSize={18}>Planes</Typography></Box>
      <Table size="small" sx={{ minWidth: 520 }}>
        <TableHead><TableRow><TableCell>Plan</TableCell><TableCell>Tipo</TableCell><TableCell align="right">Pagos</TableCell><TableCell align="right">Monto</TableCell><TableCell align="right">%</TableCell></TableRow></TableHead>
        <TableBody>
          {cargando ? <CuerpoCargando columnas={5} /> : !filas?.length ? <FilaVacia columnas={5} texto="No hay pagos en este período" /> : (
            <>
              {filas.map((f) => (
                <TableRow key={f.planId ?? f.plan} hover>
                  <TableCell>{f.plan}</TableCell>
                  <TableCell>{f.tipo || '—'}</TableCell>
                  <TableCell align="right" sx={celdaNum}>{entero(f.cantidad)}</TableCell>
                  <TableCell align="right" sx={celdaNum}>{moneda(f.monto)}</TableCell>
                  <TableCell align="right" sx={celdaNum}>{porcentaje(f.porcentaje)}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'background.default' } }}>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell align="right" sx={celdaNum}>{entero(totales?.pagos)}</TableCell>
                <TableCell align="right" sx={celdaNum}>{moneda(totales?.recaudado)}</TableCell>
                <TableCell align="right" sx={celdaNum}>100 %</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TablaCaja({ filas, cargando }) {
  const colorDiferencia = (d) => {
    const n = Number(d);
    if (d == null || !Number.isFinite(n) || n === 0) return 'text.primary';
    return n < 0 ? 'error.main' : 'warning.main';
  };
  return (
    <TableContainer component={Paper}>
      <Box px={2} pt={2} pb={1}>
        <Typography variant="h6" fontSize={18}>Caja por día</Typography>
        <Typography variant="caption" color="text.secondary">Esperado = apertura + cobrado en efectivo · Diferencia = cierre − esperado</Typography>
      </Box>
      <Table size="small" sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell><TableCell align="right">Apertura</TableCell><TableCell align="right">Cobrado efectivo</TableCell>
            <TableCell align="right">Cobrado total</TableCell><TableCell align="right">Esperado</TableCell><TableCell align="right">Cierre</TableCell>
            <TableCell align="right">Diferencia</TableCell><TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cargando ? <CuerpoCargando columnas={8} /> : !filas?.length ? <FilaVacia columnas={8} texto="No se abrió la caja en este período" /> : (
            filas.map((f) => (
              <TableRow key={f.fecha} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{fechaCorta(String(f.fecha).slice(0, 10))}</TableCell>
                <TableCell align="right" sx={celdaNum}>{moneda(f.montoApertura)}</TableCell>
                <TableCell align="right" sx={celdaNum}>{moneda(f.cobradoEfectivo)}</TableCell>
                <TableCell align="right" sx={celdaNum}>{moneda(f.cobradoTotal)}</TableCell>
                <TableCell align="right" sx={celdaNum}>{moneda(f.esperado)}</TableCell>
                <TableCell align="right" sx={celdaNum}>{f.montoCierre == null ? '—' : moneda(f.montoCierre)}</TableCell>
                <TableCell align="right" sx={{ ...celdaNum, color: colorDiferencia(f.diferencia), fontWeight: Number(f.diferencia) ? 700 : 400 }}>
                  {f.diferencia == null ? '—' : moneda(f.diferencia)}
                </TableCell>
                <TableCell><ChipEstado estado={f.estado} /></TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
