import {
  AppBar, Toolbar, Typography, IconButton, Box, Avatar, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Alert, CircularProgress, Divider, Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { NAV_ITEMS } from './navItems';
import { ACENTO, INK } from '../../theme';

const PASS_INIT = { passwordActual: '', passwordNuevo: '', passwordConfirm: '' };

export default function Navbar({ onMenuClick }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [anchor, setAnchor]         = useState(null);
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
            <Box sx={{
              width: 32, height: 32, borderRadius: 2, bgcolor: ACENTO,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FitnessCenterIcon sx={{ color: INK, fontSize: 18 }} />
            </Box>
            <Typography variant="h6" fontSize={17} color="#fff" sx={{ display: { xs: 'none', sm: 'block' } }}>
              TuGymOnLine
            </Typography>
          </Box>

          {/* Navegación horizontal (desktop) */}
          <Box sx={{
            display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.25,
            flexGrow: 1, minWidth: 0, overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            {NAV_ITEMS.map(({ label, icon, path }) => {
              const active = pathname === path || pathname.startsWith(path + '/');
              return (
                <Tooltip key={path} title={label} enterDelay={600}>
                  <Box
                    onClick={() => navigate(path)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.75,
                      px: { md: 1.1, lg: 1.5 }, py: 0.8,
                      borderRadius: 2.5,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      color: active ? ACENTO : 'rgba(237,241,249,0.55)',
                      bgcolor: active ? 'rgba(78,159,255,0.12)' : 'transparent',
                      transition: 'all 0.15s',
                      '&:hover': { color: active ? ACENTO : '#fff', bgcolor: active ? 'rgba(78,159,255,0.14)' : 'rgba(237,241,249,0.06)' },
                      '&:active': { transform: 'scale(0.96)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', '& svg': { fontSize: 19 } }}>{icon}</Box>
                    <Typography fontSize={13.5} fontWeight={active ? 700 : 500} sx={{ display: { md: 'none', lg: 'block' } }}>
                      {label}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

          <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small" sx={{ flexShrink: 0 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: ACENTO, color: INK, fontSize: 14, fontWeight: 800 }}>
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
