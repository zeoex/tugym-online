import {
  AppBar, Toolbar, Typography, IconButton, Box, Avatar, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Alert, CircularProgress, Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PASS_INIT = { passwordActual: '', passwordNuevo: '', passwordConfirm: '' };

export default function Navbar({ drawerWidth, onMenuClick }) {
  const { usuario, logout } = useAuth();
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
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml:    { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: 60 }}>
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 2, display: { md: 'none' }, color: '#fff' }}>
            <MenuIcon />
          </IconButton>

          {/* Mobile brand */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <FitnessCenterIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="h6" fontWeight={800} color="#fff">TuGymOnLine</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

          <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>
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
