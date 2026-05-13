import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

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
      background: 'linear-gradient(145deg, #0f172a 0%, #111827 60%, #0c1a2e 100%)',
    }}>
      {/* Panel izquierdo — branding */}
      <Box sx={{
        flex: 1,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 6,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Círculo decorativo de fondo */}
        <Box sx={{
          position: 'absolute',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />

        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: 3,
            bgcolor: '#06b6d4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 3,
            boxShadow: '0 0 40px rgba(6,182,212,0.4)',
          }}>
            <FitnessCenterIcon sx={{ fontSize: 38, color: '#fff' }} />
          </Box>
          <Typography variant="h3" fontWeight={800} color="#fff" gutterBottom letterSpacing="-1px">
            TuGymOnLine
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.45)', maxWidth: 300, mx: 'auto', lineHeight: 1.7 }}>
            Sistema de gestión para gimnasios. Socios, pagos y rutinas en un solo lugar.
          </Typography>

          {/* Stats decorativos */}
          <Box sx={{ display: 'flex', gap: 4, mt: 5, justifyContent: 'center' }}>
            {[['Socios', 'activos'], ['Planes', 'flexibles'], ['100%', 'digital']].map(([val, label]) => (
              <Box key={label} sx={{ textAlign: 'center' }}>
                <Typography fontWeight={800} color="#fff" fontSize={20} lineHeight={1}>{val}</Typography>
                <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.3)', mt: 0.5 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Panel derecho — formulario */}
      <Box sx={{
        width: { xs: '100%', md: 460 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 3, md: 6 },
        bgcolor: '#ffffff',
      }}>
        <Box sx={{ width: '100%', maxWidth: 360 }}>
          {/* Logo mobile */}
          <Box sx={{ display: { md: 'none' }, textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: 2,
              bgcolor: '#06b6d4',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              mb: 1.5,
            }}>
              <FitnessCenterIcon sx={{ fontSize: 28, color: '#fff' }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>TuGymOnLine</Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
            Bienvenido
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4} lineHeight={1.7}>
            Ingresá tus credenciales para continuar
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
              sx={{ mt: 1, py: 1.4, fontSize: 16 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Ingresar'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
