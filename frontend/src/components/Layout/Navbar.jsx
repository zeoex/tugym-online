import {
  AppBar, Toolbar, Typography, IconButton, Box, Avatar, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Alert, CircularProgress, Divider, Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { NAV_GROUPS } from './navItems';
import { ACENTO, INK, CROMO, FUENTE_MARCA } from '../../theme';

const PASS_INIT = { passwordActual: '', passwordNuevo: '', passwordConfirm: '' };

/* Pastilla con el contador de un ítem del menú (ej. solicitudes pendientes).
   No se renderiza cuando el total es 0. `oscuro` = sobre la barra negra;
   `sobreCromo` = dentro del pill activo (fondo cromo), donde la plata no se vería. */
function ContadorNav({ valor, oscuro = false, sobreCromo = false }) {
  if (!valor) return null;
  const colores = sobreCromo
    ? { bgcolor: INK, color: '#fff' }
    : oscuro ? { bgcolor: ACENTO, color: INK } : { bgcolor: INK, color: ACENTO };
  return (
    <Box
      component="span"
      sx={{
        minWidth: 20, height: 20, px: 0.75,
        borderRadius: 10,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, lineHeight: 1,
        ...colores,
        flexShrink: 0,
      }}
    >
      {valor > 99 ? '99+' : valor}
    </Box>
  );
}

export default function Navbar({ onMenuClick, badges = {} }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [anchor, setAnchor]         = useState(null);
  const [menuGrupo, setMenuGrupo]   = useState(null); // { label, anchorEl }
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm]             = useState(PASS_INIT);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const cerrarMenu = () => setAnchor(null);

  const abrirCambioPass = () => {
    cerrarMenu();
    setForm(PASS_INIT); setError(''); setSuccess('');
    setDialogOpen(true);
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const guardar = async () => {
    setError(''); setSuccess('');
    if (!form.passwordActual || !form.passwordNuevo) {
      setError('Completá todos los campos'); return;
    }
    if (form.passwordNuevo.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres'); return;
    }
    if (form.passwordNuevo !== form.passwordConfirm) {
      setError('Las contraseñas nuevas no coinciden'); return;
    }
    setSaving(true);
    try {
      await api.put('/auth/password', {
        passwordActual: form.passwordActual,
        passwordNuevo:  form.passwordNuevo,
      });
      setSuccess('Contraseña actualizada correctamente');
      setForm(PASS_INIT);
      setTimeout(() => setDialogOpen(false), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally { setSaving(false); }
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ minHeight: 60, gap: 1 }}>
          <IconButton edge="start" onClick={onMenuClick} sx={{ display: { md: 'none' }, color: '#fff' }}>
            <MenuIcon />
          </IconButton>

          {/* Marca */}
          <Box
            onClick={() => navigate('/dashboard')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: { md: 2 }, flexShrink: 0 }}
          >
            <Box component="img" src="/marca/toro.png" alt="Torino Fitness" sx={{ height: 26, width: 'auto', display: 'block' }} />
            <Typography
              component="span"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontFamily: FUENTE_MARCA, fontWeight: 700, fontSize: 15,
                color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1,
              }}
            >
              Torino Fitness
            </Typography>
          </Box>

          {/* Navegación agrupada (desktop): igual que el menú lateral */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, flexGrow: 1, minWidth: 0 }}>
            {NAV_GROUPS.map((grupo) => {
              const esGrupo = grupo.items.length > 1;
              const activo = grupo.items.some(({ path }) => pathname === path || pathname.startsWith(path + '/'));
              const abierto = menuGrupo?.label === (grupo.label || grupo.items[0].label);
              const contadorGrupo = grupo.items.reduce((acc, it) => acc + (it.badge ? badges[it.badge] || 0 : 0), 0);
              const estiloPill = {
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1.5, py: 0.8,
                borderRadius: 2.5,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: activo ? INK : 'rgba(244,244,242,0.6)',
                background: activo ? CROMO : abierto ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'all 0.15s',
                '&:hover': { color: activo ? INK : '#fff', background: activo ? CROMO : 'rgba(255,255,255,0.08)', filter: activo ? 'brightness(1.04)' : 'none' },
                '&:active': { transform: 'scale(0.96)' },
              };

              if (!esGrupo) {
                const { label, icon, path } = grupo.items[0];
                return (
                  <Box key={path} onClick={() => navigate(path)} sx={estiloPill}>
                    <Box sx={{ display: 'flex', '& svg': { fontSize: 19 } }}>{icon}</Box>
                    <Typography fontSize={13.5} fontWeight={activo ? 700 : 500}>{label}</Typography>
                    <ContadorNav valor={contadorGrupo} oscuro sobreCromo={activo} />
                  </Box>
                );
              }

              return (
                <Box
                  key={grupo.label}
                  onClick={(e) => setMenuGrupo(abierto ? null : { label: grupo.label, anchorEl: e.currentTarget })}
                  sx={estiloPill}
                >
                  <Typography fontSize={13.5} fontWeight={activo ? 700 : 500}>{grupo.label}</Typography>
                  <ContadorNav valor={contadorGrupo} oscuro sobreCromo={activo} />
                  <ExpandMoreIcon sx={{
                    fontSize: 17, transition: 'transform 0.2s',
                    transform: abierto ? 'rotate(180deg)' : 'none',
                  }} />
                </Box>
              );
            })}
          </Box>
          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

          {/* Desplegable del grupo */}
          <Menu
            anchorEl={menuGrupo?.anchorEl}
            open={Boolean(menuGrupo)}
            onClose={() => setMenuGrupo(null)}
            sx={{ mt: 1 }}
            slotProps={{ paper: { sx: { minWidth: 190, borderRadius: 3 } } }}
          >
            {(NAV_GROUPS.find((g) => g.label === menuGrupo?.label)?.items || []).map(({ label, icon, path, badge }) => {
              const activo = pathname === path || pathname.startsWith(path + '/');
              return (
                <MenuItem
                  key={path}
                  onClick={() => { setMenuGrupo(null); navigate(path); }}
                  selected={activo}
                  sx={{ gap: 1.5, py: 1, fontSize: 14, fontWeight: activo ? 700 : 500 }}
                >
                  <Box sx={{ display: 'flex', color: activo ? 'primary.main' : 'text.secondary', '& svg': { fontSize: 20 } }}>
                    {icon}
                  </Box>
                  <Box component="span" sx={{ flexGrow: 1 }}>{label}</Box>
                  <ContadorNav valor={badge ? badges[badge] : 0} />
                </MenuItem>
              );
            })}
          </Menu>

          <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small" sx={{ flexShrink: 0 }}>
            <Avatar sx={{ width: 34, height: 34, background: CROMO, color: INK, fontSize: 14, fontWeight: 800 }}>
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={cerrarMenu} sx={{ mt: 1 }}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>{usuario?.nombre}</Typography>
              <Typography variant="caption" color="text.secondary">{usuario?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={abrirCambioPass} sx={{ gap: 1.5, mt: 0.5 }}>
              <LockOutlinedIcon fontSize="small" color="action" />
              Cambiar contraseña
            </MenuItem>
            <MenuItem onClick={() => { cerrarMenu(); logout(); }} sx={{ gap: 1.5, color: 'error.main' }}>
              <LogoutIcon fontSize="small" />
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockOutlinedIcon color="primary" /> Cambiar contraseña
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error   && <Alert severity="error"   onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <TextField label="Contraseña actual" name="passwordActual" type="password"
              value={form.passwordActual} onChange={handleChange} required fullWidth autoComplete="current-password" />
            <TextField label="Nueva contraseña" name="passwordNuevo" type="password"
              value={form.passwordNuevo} onChange={handleChange} required fullWidth autoComplete="new-password"
              helperText="Mínimo 6 caracteres" />
            <TextField label="Confirmar nueva contraseña" name="passwordConfirm" type="password"
              value={form.passwordConfirm} onChange={handleChange} required fullWidth autoComplete="new-password" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
