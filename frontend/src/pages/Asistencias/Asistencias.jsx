import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, CircularProgress, Chip, Button,
  Autocomplete, TextField, Table, TableHead, TableBody, TableRow, TableCell,
  useTheme, useMediaQuery, Tooltip,
} from '@mui/material';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';
import GroupsIcon from '@mui/icons-material/Groups';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AddTaskIcon from '@mui/icons-material/AddTask';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import api from '../../services/api';
import SocioAvatar from '../../components/SocioAvatar';
import { ACENTO, INK } from '../../theme';
import { whatsappUrl, MSG_RECUPERACION_DEFAULT } from '../../utils/whatsapp';

const fmtHora = (f) => new Date(f).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
const fmtFecha = (f) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/* Barras simples sin librerías: livianas y de la marca */
function GraficoBarras({ datos, alto = 120 }) {
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <Box display="flex" alignItems="flex-end" gap={0.75} height={alto + 26}>
      {datos.map((d, i) => (
        <Tooltip key={i} title={`${d.tooltip ?? d.etiqueta}: ${d.valor}`} arrow>
          <Box flex={1} display="flex" flexDirection="column" alignItems="center" gap={0.5} minWidth={0}>
            <Typography variant="caption" fontSize={10} fontWeight={700} color={d.valor ? 'text.primary' : 'text.disabled'}>
              {d.valor || ''}
            </Typography>
            <Box sx={{
              width: '100%', maxWidth: 30,
              height: Math.max((d.valor / max) * alto, d.valor ? 5 : 2),
              borderRadius: '5px 5px 2px 2px',
              bgcolor: d.valor ? (d.destacada ? ACENTO : 'rgba(13,20,36,0.75)') : 'rgba(13,20,36,0.08)',
              transition: 'height 0.4s ease',
            }} />
            <Typography variant="caption" fontSize={9.5} color="text.secondary" noWrap>
              {d.etiqueta}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}

export default function Asistencias() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState(0);

  const [hoy, setHoy] = useState(null);
  const [stats, setStats] = useState(null);
  const [inactivos, setInactivos] = useState(null);

  const [socios, setSocios] = useState([]);
  const [socioSel, setSocioSel] = useState(null);
  const [registrando, setRegistrando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [msgRecuperacion, setMsgRecuperacion] = useState(MSG_RECUPERACION_DEFAULT);

  const cargarHoy = useCallback(() => {
    api.get('/asistencias/hoy').then((r) => setHoy(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    cargarHoy();
    api.get('/config')
      .then((r) => { if (r.data.msgRecuperacion) setMsgRecuperacion(r.data.msgRecuperacion); })
      .catch(() => {});
    api.get('/asistencias/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/asistencias/inactivos').then((r) => setInactivos(r.data)).catch(() => {});
    api.get('/socios', { params: { estado: 'ACTIVO', limit: 1000 } })
      .then((r) => setSocios(r.data.datos || []))
      .catch(() => {});
  }, [cargarHoy]);

  const registrarManual = async () => {
    if (!socioSel) return;
    setRegistrando(true);
    setAviso(null);
    try {
      const { data } = await api.post('/asistencias/manual', { socioId: socioSel.id });
      setAviso({
        tipo: data.yaRegistrado ? 'info' : 'ok',
        texto: data.yaRegistrado
          ? `${socioSel.nombre} ya tenía el check-in de hoy registrado.`
          : `Check-in de ${socioSel.nombre} registrado · racha ${data.racha} ${data.racha === 1 ? 'día' : 'días'} 🔥`,
      });
      setSocioSel(null);
      cargarHoy();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.response?.data?.error || 'No se pudo registrar' });
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
        <Typography variant="h4" fontSize={26}>Asistencias</Typography>
        {hoy?.entrenandoAhora > 0 && (
          <Chip
            icon={<GroupsIcon sx={{ fontSize: 16 }} />}
            label={`${hoy.entrenandoAhora} entrenando ahora`}
            size="small"
            sx={{ bgcolor: ACENTO, color: INK, fontWeight: 800, '& .MuiChip-icon': { color: INK } }}
          />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2.5}>
        Check-ins por GPS desde el celular del socio, y manuales desde recepción.
      </Typography>

      {/* Check-in manual */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <AddTaskIcon sx={{ color: 'text.secondary' }} />
        <Autocomplete
          options={socios}
          value={socioSel}
          onChange={(_e, v) => setSocioSel(v)}
          getOptionLabel={(s) => `${s.apellido}, ${s.nombre}${s.dni ? ` (${s.dni})` : ''}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          sx={{ minWidth: 260, flex: 1, maxWidth: 380 }}
          renderInput={(params) => <TextField {...params} placeholder="Buscar socio para check-in manual…" />}
        />
        <Button variant="contained" onClick={registrarManual} disabled={!socioSel || registrando}>
          {registrando ? <CircularProgress size={20} color="inherit" /> : 'Registrar'}
        </Button>
        {aviso && (
          <Typography variant="body2" fontWeight={600} sx={{
            color: aviso.tipo === 'error' ? 'error.main' : aviso.tipo === 'info' ? 'text.secondary' : 'success.main',
          }}>
            {aviso.texto}
          </Typography>
        )}
      </Paper>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<WhereToVoteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Hoy${hoy ? ` (${hoy.asistencias.length})` : ''}`} />
        <Tab icon={<QueryStatsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Estadísticas" />
        <Tab icon={<PersonOffIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Dejaron de venir${inactivos ? ` (${inactivos.length})` : ''}`} />
      </Tabs>

      {/* ── HOY ── */}
      {tab === 0 && (
        !hoy ? <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box> :
        hoy.asistencias.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <WhereToVoteIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">Todavía no hay check-ins hoy.</Typography>
            <Typography variant="caption" color="text.secondary">
              Los socios hacen check-in desde su celular al llegar al gym.
            </Typography>
          </Paper>
        ) : (
          <Paper>
            <Table size="small">
              {!isMobile && (
                <TableHead>
                  <TableRow>
                    <TableCell width={48} />
                    <TableCell>Socio</TableCell>
                    <TableCell>Hora</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell>Cuota</TableCell>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {hoy.asistencias.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell width={48}><SocioAvatar socio={a.socio} size={34} /></TableCell>
                    <TableCell>
                      <Typography fontWeight={600} fontSize={14}>{a.socio.apellido}, {a.socio.nombre}</Typography>
                      {isMobile && (
                        <Typography variant="caption" color="text.secondary">
                          {fmtHora(a.fecha)} hs · {a.metodo === 'GEO' ? 'GPS' : 'recepción'}
                        </Typography>
                      )}
                    </TableCell>
                    {!isMobile && <TableCell>{fmtHora(a.fecha)} hs</TableCell>}
                    {!isMobile && (
                      <TableCell>
                        <Chip size="small" label={a.metodo === 'GEO' ? `GPS${a.distanciaM != null ? ` · ${a.distanciaM} m` : ''}` : 'Recepción'}
                          sx={{ bgcolor: a.metodo === 'GEO' ? 'rgba(78,159,255,0.25)' : 'rgba(13,20,36,0.08)', fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                    )}
                    <TableCell>
                      {a.cuotaVencida
                        ? <Chip size="small" label="Vencida" color="warning" sx={{ fontWeight: 700, fontSize: 11 }} />
                        : <Chip size="small" label="Al día" color="success" variant="outlined" sx={{ fontWeight: 700, fontSize: 11 }} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )
      )}

      {/* ── ESTADÍSTICAS ── */}
      {tab === 1 && (
        !stats ? <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box> : (
          <Box display="flex" flexDirection="column" gap={2.5}>
            <Box display="flex" gap={2} flexWrap="wrap">
              {[
                { valor: stats.total30, label: 'asistencias en 30 días' },
                { valor: stats.sociosUnicos30, label: 'socios distintos' },
                { valor: stats.total30 ? Math.round(stats.total30 / 30 * 10) / 10 : 0, label: 'promedio por día' },
              ].map((s, i) => (
                <Paper key={i} sx={{ p: 2, flex: 1, minWidth: 140, textAlign: 'center' }}>
                  <Typography variant="h4" fontSize={28}>{s.valor}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Paper>
              ))}
            </Box>

            <Paper sx={{ p: 2.5 }}>
              <Typography fontWeight={700} mb={2}>Horas pico (últimos 30 días)</Typography>
              <GraficoBarras
                datos={stats.porHora
                  .map((v, h) => ({ etiqueta: `${h}`, tooltip: `${h}:00 a ${h + 1}:00`, valor: v }))
                  .slice(6, 24)
                  .map((d) => ({ ...d, destacada: d.valor === Math.max(...stats.porHora.slice(6, 24)) && d.valor > 0 }))}
              />
            </Paper>

            <Box display="flex" gap={2.5} flexWrap="wrap">
              <Paper sx={{ p: 2.5, flex: 2, minWidth: 300 }}>
                <Typography fontWeight={700} mb={2}>Últimos 14 días</Typography>
                <GraficoBarras datos={stats.serieDiaria.map((d, i) => ({
                  etiqueta: d.label, valor: d.total, destacada: i === stats.serieDiaria.length - 1,
                }))} />
              </Paper>
              <Paper sx={{ p: 2.5, flex: 1, minWidth: 240 }}>
                <Typography fontWeight={700} mb={2}>Por día de semana</Typography>
                <GraficoBarras datos={stats.porDiaSemana.map((v, d) => ({
                  etiqueta: DIAS[d], valor: v,
                  destacada: v === Math.max(...stats.porDiaSemana) && v > 0,
                }))} />
              </Paper>
            </Box>
          </Box>
        )
      )}

      {/* ── INACTIVOS ── */}
      {tab === 2 && (
        !inactivos ? <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box> :
        inactivos.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <LocalFireDepartmentIcon sx={{ fontSize: 40, color: ACENTO, mb: 1 }} />
            <Typography fontWeight={700}>Nadie abandonó el barco</Typography>
            <Typography variant="body2" color="text.secondary">
              Acá van a aparecer los socios activos que hace 14+ días no registran asistencia,
              para recuperarlos antes de que se den de baja.
            </Typography>
          </Paper>
        ) : (
          <Paper>
            {inactivos.map((s, i) => (
              <Box key={s.id} sx={{
                px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
                borderBottom: i < inactivos.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
              }}>
                <SocioAvatar socio={s} size={38} />
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={600} fontSize={14} noWrap>{s.apellido}, {s.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Última visita: {fmtFecha(s.ultimaAsistencia)} · hace {s.diasSinVenir} días
                  </Typography>
                </Box>
                <Chip size="small" label={`${s.diasSinVenir} días`} color={s.diasSinVenir > 30 ? 'error' : 'warning'} sx={{ fontWeight: 700 }} />
                {s.telefono && (
                  <Button size="small" variant="contained" startIcon={<WhatsAppIcon />}
                    component="a" href={whatsappUrl(s.telefono, msgRecuperacion, { nombre: s.nombre, dias: s.diasSinVenir })} target="_blank" rel="noopener noreferrer"
                    sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' }, flexShrink: 0 }}>
                    {isMobile ? '' : 'Recuperar'}
                  </Button>
                )}
              </Box>
            ))}
          </Paper>
        )
      )}
    </Box>
  );
}
