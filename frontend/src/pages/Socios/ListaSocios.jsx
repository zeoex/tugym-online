import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Chip, IconButton, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Pagination, Checkbox, FormControlLabel, Tooltip,
  useTheme, useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import api from '../../services/api';
import SocioAvatar from '../../components/SocioAvatar';

function whatsappUrl(telefono, nombre) {
  const num = telefono.replace(/\D/g, '');
  const intl = num.startsWith('54') ? num : `54${num}`;
  const msg = encodeURIComponent(
    `Hola ${nombre}! Te contactamos del gimnasio para avisarte que tu membresía se encuentra vencida. Por favor, acercate a renovarla cuando puedas. ¡Te esperamos!`
  );
  return `https://wa.me/${intl}?text=${msg}`;
}

const ESTADO_COLOR = { ACTIVO: 'success', VENCIDO: 'error', INACTIVO: 'default' };

export default function ListaSocios() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();

  const [socios, setSocios]           = useState([]);
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const [page, setPage]               = useState(1);
  const [q, setQ]                     = useState('');
  const [estado, setEstado]           = useState(searchParams.get('estado') || '');
  const [planId, setPlanId]           = useState('');
  const [venceProximo, setVenceProximo] = useState(false);
  const [fechaAltaDesde, setFechaAltaDesde] = useState('');
  const [fechaAltaHasta, setFechaAltaHasta] = useState('');
  const [planes, setPlanes]           = useState([]);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    api.get('/planes?soloActivos=true').then(({ data }) => setPlanes(data));
  }, []);

  const cargar = useCallback(async () => {
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
  }, [q, estado, page, planId, venceProximo, fechaAltaDesde, fechaAltaHasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const buscar = (e) => { e.preventDefault(); setPage(1); cargar(); };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Socios ({total})</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/socios/nuevo')} size={isMobile ? 'small' : 'medium'}>
          {isMobile ? 'Nuevo' : 'Nuevo socio'}
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box component="form" onSubmit={buscar} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small" placeholder="Nombre, DNI o email..." value={q}
            onChange={e => setQ(e.target.value)} sx={{ flex: 1, minWidth: 180 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Estado</InputLabel>
            <Select label="Estado" value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVO">Activo</MenuItem>
              <MenuItem value="VENCIDO">Vencido</MenuItem>
              <MenuItem value="INACTIVO">Inactivo</MenuItem>
            </Select>
          </FormControl>
          {!isMobile && (
            <>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Plan</InputLabel>
                <Select label="Plan" value={planId} onChange={e => { setPlanId(e.target.value); setPage(1); }}>
                  <MenuItem value="">Todos</MenuItem>
                  {planes.map(pl => <MenuItem key={pl.id} value={pl.id}>{pl.nombre}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" label="Alta desde" type="date" value={fechaAltaDesde}
                onChange={e => { setFechaAltaDesde(e.target.value); setPage(1); }}
                InputLabelProps={{ shrink: true }} sx={{ minWidth: 145 }} />
              <TextField size="small" label="Alta hasta" type="date" value={fechaAltaHasta}
                onChange={e => { setFechaAltaHasta(e.target.value); setPage(1); }}
                InputLabelProps={{ shrink: true }} sx={{ minWidth: 145 }} />
              <FormControlLabel
                control={<Checkbox checked={venceProximo} onChange={e => { setVenceProximo(e.target.checked); setPage(1); }} size="small" />}
                label="Vence en 7 días"
              />
            </>
          )}
          <Button type="submit" variant="outlined" startIcon={<SearchIcon />} size="small">Buscar</Button>
        </Box>
      </Paper>

      {/* Mobile: tarjetas */}
      {isMobile ? (
        <Box display="flex" flexDirection="column" gap={1}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
          ) : socios.map(s => {
            const pagoActivo = s.pagos?.[0];
            return (
              <Paper key={s.id} sx={{ p: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <SocioAvatar socio={s} size={44} />
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography fontWeight={600} fontSize={14} noWrap sx={{ flex: 1 }}>
                        {s.apellido}, {s.nombre}
                      </Typography>
                      <Chip label={s.estado} color={ESTADO_COLOR[s.estado]} size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {s.telefono || 'Sin teléfono'}{s.dni ? ` · DNI ${s.dni}` : ''}
                    </Typography>
                    {pagoActivo && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Vence: {new Date(pagoActivo.fechaVencimiento).toLocaleDateString('es-AR')}
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" flexShrink={0}>
                    {s.estado === 'VENCIDO' && s.telefono && (
                      <IconButton size="small" component="a" href={whatsappUrl(s.telefono, s.nombre)} target="_blank" rel="noopener noreferrer" sx={{ color: '#25D366' }}>
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => navigate(`/socios/${s.id}/detalle`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => navigate(`/socios/${s.id}`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      ) : (
        /* Desktop: tabla */
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Foto', 'Apellido y Nombre', 'DNI', 'Teléfono', 'Estado', 'Vencimiento', 'WhatsApp', ''].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={28} sx={{ my: 2 }} /></TableCell></TableRow>
              ) : socios.map(s => {
                const pagoActivo = s.pagos?.[0];
                return (
                  <TableRow key={s.id} hover>
                    <TableCell><SocioAvatar socio={s} size={36} /></TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>{s.apellido}, {s.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                    </TableCell>
                    <TableCell>{s.dni || '-'}</TableCell>
                    <TableCell>{s.telefono || '-'}</TableCell>
                    <TableCell><Chip label={s.estado} color={ESTADO_COLOR[s.estado]} size="small" /></TableCell>
                    <TableCell>{pagoActivo ? new Date(pagoActivo.fechaVencimiento).toLocaleDateString('es-AR') : '-'}</TableCell>
                    <TableCell>
                      {s.estado === 'VENCIDO' && s.telefono && (
                        <Tooltip title="Avisar por WhatsApp">
                          <IconButton size="small" component="a" href={whatsappUrl(s.telefono, s.nombre)} target="_blank" rel="noopener noreferrer" sx={{ color: '#25D366' }}>
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => navigate(`/socios/${s.id}/detalle`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => navigate(`/socios/${s.id}`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {pages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={pages} page={page} onChange={(_, v) => setPage(v)} color="primary" size={isMobile ? 'small' : 'medium'} />
        </Box>
      )}
    </Box>
  );
}
