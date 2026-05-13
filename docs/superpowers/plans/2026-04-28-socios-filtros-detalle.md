# Filtros de socios + Página de detalle con pagos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar filtros avanzados a la lista de socios y una página dedicada de detalle por socio con historial de pagos y registro de pagos.

**Architecture:** El backend extiende el endpoint `GET /socios` con 4 nuevos query params. En el frontend se crea `DetalleSocio.jsx` como nueva página en `/socios/:id/detalle` y se actualiza `ListaSocios.jsx` con los nuevos filtros y el botón de navegación al detalle.

**Tech Stack:** Node.js + Express + Prisma (SQLite), React + MUI v5, React Router v6.

---

## File Map

| Archivo | Acción |
|---|---|
| `backend/src/controllers/sociosController.js` | Modificar `listar` — nuevos filtros |
| `frontend/src/pages/Socios/ListaSocios.jsx` | Modificar — nuevos filtros + botón ojo |
| `frontend/src/App.jsx` | Modificar — agregar ruta `/socios/:id/detalle` |
| `frontend/src/pages/Socios/DetalleSocio.jsx` | Crear — página de detalle |

---

## Task 1: Backend — Extender `listar` con nuevos filtros

**Files:**
- Modify: `backend/src/controllers/sociosController.js`

- [ ] **Step 1: Reemplazar la función `listar` completa**

Abrir `backend/src/controllers/sociosController.js` y reemplazar solo la función `exports.listar` por:

```js
exports.listar = async (req, res, next) => {
  try {
    const { q = '', estado, page = 1, limit = 20, planId, venceProximo, fechaAltaDesde, fechaAltaHasta } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en7Dias = new Date(hoy);
    en7Dias.setDate(en7Dias.getDate() + 7);
    en7Dias.setHours(23, 59, 59, 999);

    const pagoCondiciones = {};
    if (planId) pagoCondiciones.planId = parseInt(planId);
    if (venceProximo === 'true') {
      pagoCondiciones.estado = 'ACTIVO';
      pagoCondiciones.fechaVencimiento = { gte: hoy, lte: en7Dias };
    }

    const where = {
      ...(estado && { estado }),
      ...(q && {
        OR: [
          { nombre:   { contains: q, mode: 'insensitive' } },
          { apellido: { contains: q, mode: 'insensitive' } },
          { dni:      { contains: q, mode: 'insensitive' } },
          { email:    { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(Object.keys(pagoCondiciones).length > 0 && { pagos: { some: pagoCondiciones } }),
      ...((fechaAltaDesde || fechaAltaHasta) && {
        fechaAlta: {
          ...(fechaAltaDesde && { gte: new Date(fechaAltaDesde) }),
          ...(fechaAltaHasta && { lte: new Date(fechaAltaHasta + 'T23:59:59.999Z') }),
        },
      }),
    };

    const [socios, total] = await Promise.all([
      prisma.socio.findMany({
        where, skip, take: parseInt(limit),
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        include: {
          pagos: { where: { estado: 'ACTIVO' }, orderBy: { fechaVencimiento: 'desc' }, take: 1 },
        },
      }),
      prisma.socio.count({ where }),
    ]);
    res.json({ datos: socios, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};
```

- [ ] **Step 2: Verificar que el backend sigue corriendo sin errores**

El backend corre con nodemon y recargará automáticamente. En la terminal del backend confirmar que no haya errores de sintaxis — debe mostrar `GymApp backend corriendo en http://localhost:4000`.

- [ ] **Step 3: Verificar filtros manualmente con curl**

```bash
curl "http://localhost:4000/api/socios?venceProximo=true" -H "Authorization: Bearer <token>"
```
Expected: JSON con `{ datos: [...], total: N }`. Si no hay socios con vencimiento próximo, `datos` puede ser `[]`.

---

## Task 2: Frontend — Actualizar ListaSocios con nuevos filtros y botón detalle

**Files:**
- Modify: `frontend/src/pages/Socios/ListaSocios.jsx`

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, Chip, IconButton, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl, InputLabel, CircularProgress, Pagination, Checkbox, FormControlLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../services/api';

const ESTADO_COLOR = { ACTIVO: 'success', VENCIDO: 'error', INACTIVO: 'default' };

export default function ListaSocios() {
  const navigate = useNavigate();
  const [socios, setSocios] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [planId, setPlanId] = useState('');
  const [venceProximo, setVenceProximo] = useState(false);
  const [fechaAltaDesde, setFechaAltaDesde] = useState('');
  const [fechaAltaHasta, setFechaAltaHasta] = useState('');
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/planes?soloActivos=true').then(({ data }) => setPlanes(data));
  }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const params = { q, estado, page, limit: 15 };
      if (planId) params.planId = planId;
      if (venceProximo) params.venceProximo = 'true';
      if (fechaAltaDesde) params.fechaAltaDesde = fechaAltaDesde;
      if (fechaAltaHasta) params.fechaAltaHasta = fechaAltaHasta;
      const { data } = await api.get('/socios', { params });
      setSocios(data.datos); setTotal(data.total); setPages(data.pages);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [page, estado, planId, venceProximo]);

  const buscar = (e) => { e.preventDefault(); setPage(1); cargar(); };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Socios ({total})</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/socios/nuevo')}>Nuevo socio</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box component="form" onSubmit={buscar} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField size="small" placeholder="Buscar por nombre, DNI o email..." value={q} onChange={e => setQ(e.target.value)} sx={{ flex: 1, minWidth: 200 }} />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Estado</InputLabel>
            <Select label="Estado" value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVO">Activo</MenuItem>
              <MenuItem value="VENCIDO">Vencido</MenuItem>
              <MenuItem value="INACTIVO">Inactivo</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Plan</InputLabel>
            <Select label="Plan" value={planId} onChange={e => { setPlanId(e.target.value); setPage(1); }}>
              <MenuItem value="">Todos</MenuItem>
              {planes.map(pl => <MenuItem key={pl.id} value={pl.id}>{pl.nombre}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="Alta desde" type="date" value={fechaAltaDesde} onChange={e => setFechaAltaDesde(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
          <TextField size="small" label="Alta hasta" type="date" value={fechaAltaHasta} onChange={e => setFechaAltaHasta(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
          <FormControlLabel
            control={<Checkbox checked={venceProximo} onChange={e => { setVenceProximo(e.target.checked); setPage(1); }} size="small" />}
            label="Vence en 7 días"
          />
          <Button type="submit" variant="outlined" startIcon={<SearchIcon />}>Buscar</Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {['Foto', 'Apellido y Nombre', 'DNI', 'Teléfono', 'Estado', 'Vencimiento', ''].map(h => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={28} sx={{ my: 2 }} /></TableCell></TableRow>
            ) : socios.map(s => {
              const pagoActivo = s.pagos?.[0];
              return (
                <TableRow key={s.id} hover>
                  <TableCell><Avatar src={s.foto} sx={{ width: 36, height: 36 }}>{s.nombre.charAt(0)}</Avatar></TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{s.apellido}, {s.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                  </TableCell>
                  <TableCell>{s.dni || '-'}</TableCell>
                  <TableCell>{s.telefono || '-'}</TableCell>
                  <TableCell><Chip label={s.estado} color={ESTADO_COLOR[s.estado]} size="small" /></TableCell>
                  <TableCell>{pagoActivo ? new Date(pagoActivo.fechaVencimiento).toLocaleDateString('es-AR') : '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" title="Ver detalle" onClick={() => navigate(`/socios/${s.id}/detalle`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title="Editar" onClick={() => navigate(`/socios/${s.id}`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {pages > 1 && <Box display="flex" justifyContent="center" mt={2}><Pagination count={pages} page={page} onChange={(_, v) => setPage(v)} color="primary" /></Box>}
    </Box>
  );
}
```

- [ ] **Step 2: Verificar en el navegador**

Abrir `http://localhost:5173/socios`. Confirmar:
- Aparece selector "Plan" con los planes activos
- Aparece checkbox "Vence en 7 días"
- Aparecen campos "Alta desde" y "Alta hasta"
- Cada fila de la tabla tiene dos iconos: ojo y lápiz

---

## Task 3: Frontend — Agregar ruta en App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Agregar import y ruta**

En `frontend/src/App.jsx`, agregar el import:

```js
import DetalleSocio from './pages/Socios/DetalleSocio';
```

Y agregar la ruta **antes** de `socios/:id` para que el router no la confunda (React Router v6 hace matching exacto, pero es buena práctica colocar rutas más específicas primero):

```jsx
<Route path="socios/:id/detalle" element={<DetalleSocio />} />
<Route path="socios/:id"         element={<FormSocio />} />
```

El bloque de rutas completo queda:

```jsx
<Route path="dashboard"          element={<Dashboard />} />
<Route path="socios"             element={<ListaSocios />} />
<Route path="socios/nuevo"       element={<FormSocio />} />
<Route path="socios/:id/detalle" element={<DetalleSocio />} />
<Route path="socios/:id"         element={<FormSocio />} />
<Route path="planes"             element={<GestionPlanes />} />
<Route path="pagos"              element={<GestionPagos />} />
<Route path="vencimientos"       element={<Vencimientos />} />
```

---

## Task 4: Frontend — Crear DetalleSocio.jsx

**Files:**
- Create: `frontend/src/pages/Socios/DetalleSocio.jsx`

- [ ] **Step 1: Crear el archivo con el contenido completo**

```jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Avatar, Chip, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert, Divider, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import api from '../../services/api';

const ESTADO_COLOR      = { ACTIVO: 'success', VENCIDO: 'error', INACTIVO: 'default' };
const ESTADO_PAGO_COLOR = { ACTIVO: 'success', VENCIDO: 'error', CANCELADO: 'default' };
const METODOS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'];

export default function DetalleSocio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openPago, setOpenPago] = useState(false);
  const [planes, setPlanes] = useState([]);
  const [form, setForm] = useState({ planId: '', metodoPago: 'EFECTIVO', observaciones: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/socios/${id}`);
      setSocio(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [id]);

  const abrirPago = async () => {
    const { data } = await api.get('/planes?soloActivos=true');
    setPlanes(data);
    setForm({ planId: '', metodoPago: 'EFECTIVO', observaciones: '' });
    setError('');
    setOpenPago(true);
  };

  const guardarPago = async () => {
    setError(''); setSaving(true);
    try {
      await api.post('/pagos', {
        socioId: parseInt(id),
        planId: form.planId,
        metodoPago: form.metodoPago,
        observaciones: form.observaciones,
      });
      setOpenPago(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar pago');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (!socio) return null;

  const pagoActivo   = socio.pagos.find(p => p.estado === 'ACTIVO');
  const totalPagado  = socio.pagos.reduce((acc, p) => acc + p.monto, 0);
  const mesesComoSocio = Math.floor(
    (new Date() - new Date(socio.fechaAlta)) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <Box>
      {/* Cabecera */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/socios')}><ArrowBackIcon /></IconButton>
        <Avatar src={socio.foto} sx={{ width: 56, height: 56 }}>{socio.nombre.charAt(0)}</Avatar>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700}>{socio.apellido}, {socio.nombre}</Typography>
          <Typography variant="body2" color="text.secondary">{socio.email}</Typography>
        </Box>
        <Chip label={socio.estado} color={ESTADO_COLOR[socio.estado]} />
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/socios/${id}`)}>
          Editar
        </Button>
      </Box>

      {/* Tarjetas de resumen */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Datos del socio</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">DNI</Typography>
                  <Typography>{socio.dni || '-'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Teléfono</Typography>
                  <Typography>{socio.telefono || '-'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Email</Typography>
                  <Typography>{socio.email || '-'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Fecha de alta</Typography>
                  <Typography>{new Date(socio.fechaAlta).toLocaleDateString('es-AR')}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Plan activo</Typography>
                  <Typography>{pagoActivo?.plan?.nombre || 'Sin plan'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Vencimiento</Typography>
                  <Typography>
                    {pagoActivo ? new Date(pagoActivo.fechaVencimiento).toLocaleDateString('es-AR') : '-'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Estadísticas</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Total pagado</Typography>
                  <Typography fontWeight={700} color="success.main">
                    ${Number(totalPagado).toLocaleString('es-AR')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Cantidad de pagos</Typography>
                  <Typography>{socio.pagos.length}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Meses como socio</Typography>
                  <Typography>{mesesComoSocio}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Historial de pagos */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>Historial de pagos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirPago}>
          Registrar pago
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {['Plan', 'Monto', 'Fecha pago', 'Vencimiento', 'Método', 'Estado'].map(h => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {socio.pagos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Sin pagos registrados
                </TableCell>
              </TableRow>
            ) : socio.pagos.map(p => (
              <TableRow key={p.id} hover>
                <TableCell>{p.plan?.nombre}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                  ${Number(p.monto).toLocaleString('es-AR')}
                </TableCell>
                <TableCell>{new Date(p.fechaPago).toLocaleDateString('es-AR')}</TableCell>
                <TableCell>{new Date(p.fechaVencimiento).toLocaleDateString('es-AR')}</TableCell>
                <TableCell>{p.metodoPago}</TableCell>
                <TableCell>
                  <Chip label={p.estado} color={ESTADO_PAGO_COLOR[p.estado]} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog registro de pago */}
      <Dialog open={openPago} onClose={() => setOpenPago(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar pago — {socio.apellido}, {socio.nombre}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <FormControl fullWidth required>
              <InputLabel>Plan</InputLabel>
              <Select
                label="Plan"
                value={form.planId}
                onChange={e => setForm(p => ({ ...p, planId: e.target.value }))}
              >
                {planes.map(pl => (
                  <MenuItem key={pl.id} value={pl.id}>
                    {pl.nombre} — ${Number(pl.precio).toLocaleString('es-AR')} ({pl.duracionDias} días)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Método de pago</InputLabel>
              <Select
                label="Método de pago"
                value={form.metodoPago}
                onChange={e => setForm(p => ({ ...p, metodoPago: e.target.value }))}
              >
                {METODOS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Observaciones"
              value={form.observaciones}
              onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
              multiline rows={2} fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPago(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarPago} disabled={saving || !form.planId}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Confirmar pago'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
```

- [ ] **Step 2: Verificar en el navegador**

1. Ir a `http://localhost:5173/socios`
2. Hacer clic en el ícono de ojo de cualquier socio
3. Confirmar que carga la página `/socios/:id/detalle` con:
   - Cabecera con avatar, nombre, estado, botón Editar
   - Card izquierda con datos del socio
   - Card derecha con estadísticas (total pagado, cantidad de pagos, meses)
   - Tabla de historial de pagos
   - Botón "Registrar pago"
4. Hacer clic en "Registrar pago", seleccionar plan y método, confirmar
5. Verificar que el nuevo pago aparece en la tabla y las estadísticas se actualizan
6. Verificar que el botón "Editar" navega al formulario del socio
7. Verificar que la flecha "volver" regresa a `/socios`
