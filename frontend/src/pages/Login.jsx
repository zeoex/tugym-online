import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { NOCHE, NOCHE_PAPEL, INK, HUESO, ACENTO, ACERO, CROMO, BRILLO } from '../theme';

/* El login vive bajo el adminTheme (claro) pero se dibuja sobre negro:
   hay que forzar los colores de input y label dentro de la tarjeta, si no
   el texto sale negro sobre negro (ver commit 0081896). */
const CAMPO_SX = {
  '& .MuiOutlinedInput-root': {
    color: HUESO,
    bgcolor: 'rgba(255,255,255,0.04)',
    '& fieldset': { borderColor: 'rgba(244,244,242,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(244,244,242,0.4)' },
    '&.Mui-focused fieldset': { borderColor: ACENTO, borderWidth: 1 },
  },
  '& .MuiInputLabel-root': { color: 'rgba(244,244,242,0.55)' },
  '& .MuiInputLabel-root.Mui-focused': { color: ACENTO },
  /* El autocompletado de Chrome pisa color y fondo con los suyos. */
  '& input:-webkit-autofill': {
    WebkitTextFillColor: HUESO,
    WebkitBoxShadow: `0 0 0 100px ${NOCHE_PAPEL} inset`,
    caretColor: HUESO,
  },
};

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      px: 2, py: 6,
      bgcolor: NOCHE,
      backgroundImage: 'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(255,255,255,0.07), transparent)',
    }}>
      {/* Marca completa: toro + nombre, en cromo sobre negro */}
      <Box
        component="img"
        src="/marca/logo.png"
        alt="Torino Fitness"
        sx={{ width: 220, maxWidth: '70vw', height: 'auto', mb: 4, filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.6))' }}
      />

      {/* Tarjeta del formulario */}
      <Box sx={{
        width: '100%',
        maxWidth: 400,
        bgcolor: NOCHE_PAPEL,
        border: '1px solid rgba(244,244,242,0.08)',
        borderRadius: 4,
        p: { xs: 3, sm: 4 },
        boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
      }}>
        <Typography variant="h6" sx={{ color: HUESO, fontWeight: 700, mb: 0.5 }}>
          Iniciar sesión
        </Typography>
        <Typography variant="body2" sx={{ color: ACERO, mb: 3, lineHeight: 1.6 }}>
          Ingresá tus credenciales para entrar al panel.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Usuario"
            type="text"
            autoComplete="username"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
            fullWidth
            autoFocus
            sx={CAMPO_SX}
          />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
            fullWidth
            sx={CAMPO_SX}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            fullWidth
            sx={{
              mt: 1, py: 1.4, fontSize: 16,
              background: CROMO,
              color: INK,
              boxShadow: BRILLO,
              '&:hover': { background: CROMO, filter: 'brightness(1.05)', boxShadow: BRILLO },
              '&.Mui-disabled': { background: CROMO, color: INK, opacity: 0.6 },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Ingresar'}
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(244,244,242,0.3)', mt: 3, letterSpacing: '0.04em' }}>
        Panel de administración
      </Typography>
    </Box>
  );
}
