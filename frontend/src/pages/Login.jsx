import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { useAuth } from '../context/AuthContext';

/* Pesas decorativas dispersas en el fondo */
const BG_ICONS = [
  { Icon: FitnessCenterIcon, top: '6%',  left: '4%',   size: 90,  rotate: -30, opacity: 0.07 },
  { Icon: FitnessCenterIcon, top: '10%', right: '6%',  size: 60,  rotate:  25, opacity: 0.06 },
  { Icon: FitnessCenterIcon, top: '38%', left: '-2%',  size: 110, rotate: -15, opacity: 0.05 },
  { Icon: FitnessCenterIcon, top: '55%', right: '2%',  size: 80,  rotate:  40, opacity: 0.06 },
  { Icon: DirectionsRunIcon, top: '72%', left: '8%',   size: 70,  rotate: -10, opacity: 0.07 },
  { Icon: FitnessCenterIcon, bottom:'5%',right: '8%',  size: 100, rotate: -35, opacity: 0.05 },
  { Icon: FitnessCenterIcon, bottom:'12%',left:'30%',  size: 55,  rotate:  20, opacity: 0.04 },
  { Icon: DirectionsRunIcon, top: '25%', right: '18%', size: 50,  rotate:   5, opacity: 0.05 },
];

/* Mobile va sobre el fondo oscuro; desktop sobre el panel blanco.
   Ojo: cada breakpoint necesita su valor explicito. Un `md: undefined`
   no resetea el valor de xs, se filtra y deja letras blancas sobre blanco. */
const CAMPO_SX = {
  '& .MuiOutlinedInput-root': {
    color: { xs: '#fff', md: 'rgba(0,0,0,0.87)' },
    bgcolor: { xs: 'rgba(255,255,255,0.06)', md: 'transparent' },
    '& fieldset': { borderColor: { xs: 'rgba(255,255,255,0.25)', md: 'rgba(0,0,0,0.23)' } },
    '&:hover fieldset': { borderColor: { xs: 'rgba(255,255,255,0.5)', md: 'rgba(0,0,0,0.87)' } },
    '&.Mui-focused fieldset': { borderColor: { xs: '#C8F13F', md: '#7C9A16' } },
  },
  '& .MuiInputLabel-root': { color: { xs: 'rgba(255,255,255,0.6)', md: 'rgba(0,0,0,0.6)' } },
  '& .MuiInputLabel-root.Mui-focused': { color: { xs: '#C8F13F', md: '#5A700F' } },
  /* El autocompletado de Chrome pisa color y fondo con los suyos. */
  '& input:-webkit-autofill': {
    WebkitTextFillColor: { xs: '#fff', md: 'rgba(0,0,0,0.87)' },
    WebkitBoxShadow: { xs: '0 0 0 100px #1B2113 inset', md: '0 0 0 100px #fff inset' },
    caretColor: { xs: '#fff', md: 'rgba(0,0,0,0.87)' },
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
      background: 'linear-gradient(145deg, #0B0D08 0%, #12160D 60%, #0E1409 100%)',
    }}>

      {/* ── Panel izquierdo branding (solo desktop) ── */}
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
        <Box sx={{
          position: 'absolute',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,241,63,0.15) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />
        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: 3, bgcolor: '#C8F13F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 3, boxShadow: '0 0 40px rgba(200,241,63,0.4)',
          }}>
            <FitnessCenterIcon sx={{ fontSize: 38, color: '#12160D' }} />
          </Box>
          <Typography variant="h3" fontWeight={800} color="#fff" gutterBottom letterSpacing="-1px">
            TuGymOnLine
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.45)', maxWidth: 300, mx: 'auto', lineHeight: 1.7 }}>
            Sistema de gestión para gimnasios. Socios, pagos y rutinas en un solo lugar.
          </Typography>
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

      {/* ── Panel derecho — formulario ── */}
      <Box sx={{
        width: { xs: '100%', md: 460 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 3, md: 6 },
        position: 'relative',
        /* Mobile: fondo transparente sobre el dark bg global */
        bgcolor: { xs: 'transparent', md: '#ffffff' },
        overflow: 'hidden',
      }}>

        {/* Iconos decorativos — solo mobile */}
        {BG_ICONS.map(({ Icon, size, rotate, opacity, ...pos }, i) => (
          <Box
            key={i}
            sx={{
              display: { xs: 'block', md: 'none' },
              position: 'absolute',
              ...pos,
              pointerEvents: 'none',
              transform: `rotate(${rotate}deg)`,
              opacity,
              color: '#fff',
            }}
          >
            <Icon sx={{ fontSize: size }} />
          </Box>
        ))}

        {/* Brilillo radial mobile */}
        <Box sx={{
          display: { xs: 'block', md: 'none' },
          position: 'absolute',
          width: 340, height: 340, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,241,63,0.18) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />

        {/* Card del formulario */}
        <Box sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 360,
          /* Mobile: glassmorphism sobre fondo oscuro */
          bgcolor: { xs: 'rgba(255,255,255,0.07)', md: 'transparent' },
          backdropFilter: { xs: 'blur(16px)', md: 'none' },
          borderRadius: { xs: 4, md: 0 },
          border: { xs: '1px solid rgba(255,255,255,0.12)', md: 'none' },
          p: { xs: 3.5, md: 0 },
        }}>

          {/* Logo + marca — mobile */}
          <Box sx={{ display: { md: 'none' }, textAlign: 'center', mb: 3.5 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: 2.5,
              bgcolor: '#C8F13F',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              mb: 1.5,
              boxShadow: '0 0 28px rgba(200,241,63,0.5)',
            }}>
              <FitnessCenterIcon sx={{ fontSize: 34, color: '#12160D' }} />
            </Box>
            <Typography variant="h5" fontWeight={800} color="#fff" letterSpacing="-0.5px">
              TuGymOnLine
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
              Sistema de gestión de gimnasios
            </Typography>
          </Box>

          {/* Título — desktop */}
          <Typography variant="h4" fontWeight={800} color={{ xs: '#fff', md: 'text.primary' }} gutterBottom sx={{ display: { xs: 'none', md: 'block' } }}>
            Bienvenido
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#fff" gutterBottom sx={{ display: { xs: 'block', md: 'none' } }}>
            Iniciar sesión
          </Typography>
          <Typography variant="body2" sx={{ color: { xs: 'rgba(255,255,255,0.5)', md: 'text.secondary' } }} mb={3} lineHeight={1.7}>
            Ingresá tus credenciales para continuar
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
                bgcolor: '#C8F13F',
                color: '#12160D',
                '&:hover': { bgcolor: '#B9E32C' },
                boxShadow: { xs: '0 0 20px rgba(200,241,63,0.4)', md: 'none' },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Ingresar'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
