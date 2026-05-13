import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BlockIcon from '@mui/icons-material/Block';
import PeopleIcon from '@mui/icons-material/People';
import api from '../../services/api';

const fmt = (n) => `$${Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

async function generarPDF(resumen) {
  const { jsPDF }    = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');

  const doc   = new jsPDF();
  const fecha = new Date(resumen.caja.fecha).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const HEAD = { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold' };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TuGymOnLine — Resumen de Caja', 14, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${fecha}`, 14, 30);
  doc.text(`Estado: ${resumen.caja.estado}`, 14, 37);

  doc.setFont('helvetica', 'bold');
  doc.text('Resumen financiero', 14, 50);
  autoTable(doc, {
    startY: 54,
    head: [['Concepto', 'Monto']],
    body: [
      ['Monto apertura',      fmt(resumen.caja.montoApertura)],
      ['Socios activos',      String(resumen.sociosActivos ?? '-')],
      ['Total pagos del dia', fmt(resumen.totalPagos)],
      ['Monto cierre',        resumen.caja.montoCierre != null ? fmt(resumen.caja.montoCierre) : '-'],
      ['Diferencia',          resumen.diferencia != null ? fmt(resumen.diferencia) : '-'],
    ],
    styles: { fontSize: 10 },
    headStyles: HEAD,
  });

  const metodos = Object.entries(resumen.porMetodo);
  if (metodos.length > 0) {
    const y = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Por metodo de pago', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Metodo', 'Total']],
      body: metodos.map(([m, v]) => [m, fmt(v)]),
      styles: { fontSize: 10 },
      headStyles: HEAD,
    });
  }

  if (resumen.pagos.length > 0) {
    const y2 = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de pagos', 14, y2);
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Socio', 'Plan', 'Monto', 'Metodo', 'Hora']],
      body: resumen.pagos.map(p => [
        `${p.socio.apellido}, ${p.socio.nombre}`,
        p.plan?.nombre || '-',
        fmt(p.monto),
        p.metodoPago,
        new Date(p.fechaPago).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      ]),
      styles: { fontSize: 9 },
      headStyles: HEAD,
    });
  }

  if (resumen.morosos && resumen.morosos.length > 0) {
    const y3 = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Socios morosos', 14, y3);
    autoTable(doc, {
      startY: y3 + 4,
      head: [['Socio', 'Telefono', 'Email']],
      body: resumen.morosos.map(s => [
        `${s.apellido}, ${s.nombre}`,
        s.telefono || '-',
        s.email || '-',
      ]),
      styles: { fontSize: 9 },
      headStyles: { ...HEAD, fillColor: [220, 38, 38] },
    });
  }

  doc.save(`caja-${new Date(resumen.caja.fecha).toISOString().slice(0, 10)}.pdf`);
}

function buildWhatsAppText(resumen) {
  const fecha = new Date(resumen.caja.fecha).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const metodos = Object.entries(resumen.porMetodo)
    .map(([m, v]) => `  • ${m}: ${fmt(v)}`)
    .join('\n');

  const movs = resumen.pagos.length
    ? resumen.pagos.map(p =>
        `  • ${p.socio.apellido}, ${p.socio.nombre} — ${p.plan?.nombre || '-'} — ${fmt(p.monto)} (${p.metodoPago})`
      ).join('\n')
    : '  Sin movimientos';

  const moros = resumen.morosos && resumen.morosos.length
    ? resumen.morosos.map(s =>
        `  • ${s.apellido}, ${s.nombre}${s.telefono ? ` — ${s.telefono}` : ''}`
      ).join('\n')
    : '  Sin morosos';

  return [
    `*GymApp — Resumen de Caja*`,
    `📅 ${fecha}`,
    `Estado: ${resumen.caja.estado}`,
    ``,
    `*💰 Financiero*`,
    `Apertura: ${fmt(resumen.caja.montoApertura)}`,
    `Total pagos: ${fmt(resumen.totalPagos)}`,
    resumen.caja.montoCierre != null ? `Cierre: ${fmt(resumen.caja.montoCierre)}` : null,
    resumen.diferencia != null ? `Diferencia: ${fmt(resumen.diferencia)}` : null,
    ``,
    `*Por método:*`,
    metodos || '  Sin pagos',
    ``,
    `*👥 Socios activos: ${resumen.sociosActivos ?? '-'}*`,
    ``,
    `*📋 Movimientos del día (${resumen.pagos.length})*`,
    movs,
    ``,
    `*⚠️ Morosos (${resumen.morosos?.length ?? 0})*`,
    moros,
  ].filter(l => l !== null).join('\n');
}

export default function Caja() {
  const [caja, setCaja]         = useState(null);
  const [resumen, setResumen]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [abrirDlg, setAbrirDlg] = useState(false);
  const [cerrarDlg, setCerrarDlg] = useState(false);
  const [formAbrir, setFormAbrir] = useState({ montoApertura: '', observaciones: '' });
  const [formCerrar, setFormCerrar] = useState({ montoCierre: '', observaciones: '' });
  const [saving, setSaving]     = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/caja/hoy');
      setCaja(data);
      if (data) {
        const [resRes, morosRes, activosRes] = await Promise.all([
          api.get(`/caja/${data.id}/resumen`),
          api.get('/socios', { params: { estado: 'VENCIDO', limit: 200 } }),
          api.get('/socios', { params: { estado: 'ACTIVO', limit: 1 } }),
        ]);
        setResumen({
          ...resRes.data,
          morosos: morosRes.data.datos ?? [],
          sociosActivos: activosRes.data.total ?? 0,
        });
      }
    } catch { setError('Error al cargar la caja'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAbrir = async () => {
    setSaving(true);
    try {
      await api.post('/caja/abrir', formAbrir);
      setAbrirDlg(false);
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al abrir caja'); }
    finally { setSaving(false); }
  };

  const handleCerrar = async () => {
    setSaving(true);
    try {
      await api.put(`/caja/${caja.id}/cerrar`, formCerrar);
      setCerrarDlg(false);
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al cerrar caja'); }
    finally { setSaving(false); }
  };

  const handleWhatsApp = () => {
    if (!resumen) return;
    const text = buildWhatsAppText(resumen);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>;

  const fechaHoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <PointOfSaleIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Caja del Día</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{fechaHoy}</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {!caja ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>La caja no fue abierta hoy</Typography>
          <Typography variant="body2" color="text.disabled" mb={3}>
            Abrí la caja para registrar los movimientos del día
          </Typography>
          <Button variant="contained" size="large" startIcon={<LockOpenIcon />} onClick={() => setAbrirDlg(true)}>
            Abrir Caja
          </Button>
        </Paper>
      ) : (
        <>
          {/* Banner estado */}
          <Paper sx={{
            p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            bgcolor: caja.estado === 'ABIERTA' ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${caja.estado === 'ABIERTA' ? '#86efac' : '#e2e8f0'}`,
          }}>
            {caja.estado === 'ABIERTA'
              ? <LockOpenIcon sx={{ color: '#10b981' }} />
              : <LockIcon sx={{ color: '#64748b' }} />}
            <Box flex={1}>
              <Typography fontWeight={700}>
                Caja {caja.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Apertura: {fmt(caja.montoApertura)}
                {caja.observaciones && ` · ${caja.observaciones}`}
              </Typography>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {resumen && (
                <>
                  <Button startIcon={<PictureAsPdfIcon />} variant="outlined" size="small"
                    onClick={() => generarPDF(resumen)}>
                    PDF
                  </Button>
                  <Button startIcon={<WhatsAppIcon />} variant="outlined" size="small"
                    sx={{ borderColor: '#25D366', color: '#25D366', '&:hover': { borderColor: '#1da851', color: '#1da851', bgcolor: '#f0fdf4' } }}
                    onClick={handleWhatsApp}>
                    WhatsApp
                  </Button>
                </>
              )}
              {caja.estado === 'ABIERTA' && (
                <Button variant="contained" color="error" startIcon={<LockIcon />} size="small"
                  onClick={() => { setFormCerrar({ montoCierre: '', observaciones: '' }); setCerrarDlg(true); }}>
                  Cerrar Caja
                </Button>
              )}
            </Box>
          </Paper>

          {/* Tarjetas resumen */}
          {resumen && (
            <Grid container spacing={2} mb={3}>
              {[
                { label: 'Apertura',        valor: fmt(resumen.caja.montoApertura),  color: '#3b82f6' },
                { label: 'Pagos del día',   valor: fmt(resumen.totalPagos),          color: '#10b981', sub: `${resumen.pagos.length} pago/s` },
                { label: 'Socios activos',  valor: resumen.sociosActivos ?? '-',     color: '#0ea5e9' },
                { label: 'Morosos',         valor: resumen.morosos?.length ?? '-',   color: '#ef4444' },
                { label: 'Cierre',          valor: resumen.caja.montoCierre != null ? fmt(resumen.caja.montoCierre) : '—', color: '#8b5cf6' },
                { label: 'Diferencia',      valor: resumen.diferencia != null ? fmt(resumen.diferencia) : '—',
                  color: resumen.diferencia >= 0 ? '#10b981' : '#ef4444' },
              ].map(c => (
                <Grid item xs={6} sm={4} md={2} key={c.label}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: c.color }}>{c.valor}</Typography>
                      {c.sub && <Typography variant="caption" color="text.secondary">{c.sub}</Typography>}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Por método de pago */}
          {resumen && Object.keys(resumen.porMetodo).length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Por método de pago</Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                {Object.entries(resumen.porMetodo).map(([metodo, total]) => (
                  <Box key={metodo}>
                    <Typography variant="caption" color="text.secondary">{metodo}</Typography>
                    <Typography fontWeight={700}>{fmt(total)}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Tabla de pagos */}
          <Typography variant="h6" fontWeight={700} mb={1.5}>Movimientos del día</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Hora', 'Socio', 'Plan', 'Método', 'Monto'].map(h => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!resumen || resumen.pagos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Sin movimientos registrados hoy
                    </TableCell>
                  </TableRow>
                ) : resumen.pagos.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>{new Date(p.fechaPago).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell>{p.socio.apellido}, {p.socio.nombre}</TableCell>
                    <TableCell>{p.plan?.nombre || '-'}</TableCell>
                    <TableCell><Chip label={p.metodoPago} size="small" variant="outlined" /></TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>{fmt(p.monto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Tabla morosos */}
          {resumen && (
            <>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <BlockIcon color="error" fontSize="small" />
                <Typography variant="h6" fontWeight={700}>Socios Morosos</Typography>
                <Chip label={resumen.morosos?.length ?? 0}
                  color={resumen.morosos?.length > 0 ? 'error' : 'success'} size="small" />
              </Box>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Socio', 'Teléfono', 'Email'].map(h => (
                        <TableCell key={h}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!resumen.morosos?.length ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          Sin socios morosos
                        </TableCell>
                      </TableRow>
                    ) : resumen.morosos.map((s, i) => (
                      <TableRow key={i} hover>
                        <TableCell><Typography fontWeight={500}>{s.apellido}, {s.nombre}</Typography></TableCell>
                        <TableCell>{s.telefono || '-'}</TableCell>
                        <TableCell>{s.email || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}

      {/* Dialog abrir */}
      <Dialog open={abrirDlg} onClose={() => setAbrirDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockOpenIcon color="success" /> Abrir Caja
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Monto de apertura ($)" type="number" fullWidth
              value={formAbrir.montoApertura}
              onChange={e => setFormAbrir(p => ({ ...p, montoApertura: e.target.value }))}
              helperText="Efectivo en caja al inicio del día"
            />
            <TextField
              label="Observaciones" fullWidth multiline rows={2}
              value={formAbrir.observaciones}
              onChange={e => setFormAbrir(p => ({ ...p, observaciones: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAbrirDlg(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={handleAbrir} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Abrir Caja'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog cerrar */}
      <Dialog open={cerrarDlg} onClose={() => setCerrarDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon color="error" /> Cerrar Caja
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {resumen && (
              <Alert severity="info">
                Total pagos del día: <strong>{fmt(resumen.totalPagos)}</strong>
              </Alert>
            )}
            <TextField
              label="Monto de cierre ($)" type="number" fullWidth
              value={formCerrar.montoCierre}
              onChange={e => setFormCerrar(p => ({ ...p, montoCierre: e.target.value }))}
              helperText="Efectivo contado en caja al cierre"
            />
            <TextField
              label="Observaciones" fullWidth multiline rows={2}
              value={formCerrar.observaciones}
              onChange={e => setFormCerrar(p => ({ ...p, observaciones: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCerrarDlg(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleCerrar} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Cerrar Caja'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
