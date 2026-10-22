import { useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, CircularProgress,
  InputAdornment, IconButton,
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ACENTO, ACENTO_SUAVE, BRILLO } from '../../theme';
import { portalApi, dniGuardado, sesionSocio } from './portalApi';

/* Ingreso del socio: DNI + contraseña. La primera vez crea la suya.
   `compacto` lo usa la landing (sin Paper ni ícono, vive dentro de la barra). */
export default function LoginSocio({ onIngreso, compacto = false }) {
  const [dni, setDni] = useState(dniGuardado.get());
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [paso, setPaso] = useState('login'); // login | activar
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const entrar = async () => {
    if (!dni.trim()) return;
    setError('');
    setCargando(true);
    try {
      if (paso === 'activar') {
        if (password.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return; }
        if (password !== confirmar) { setError('Las contraseñas no coinciden'); return; }
        const { data } = await portalApi.post('/activar', { dni: dni.trim(), password });
        dniGuardado.set(dni);
        sesionSocio.set(data.token, data.socio.nombre);
        onIngreso();
      } else {
        const { data } = await portalApi.post('/login', { dni: dni.trim(), password });
        if (data.necesitaActivacion) {
          setPaso('activar');
          setPassword('');
          setError('');
          return;
        }
        dniGuardado.set(dni);
        sesionSocio.set(data.token, data.socio.nombre);
        onIngreso();
      }
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo ingresar');
    } finally {
      setCargando(false);
    }
  };

  const formulario = (
    <>
      {paso === 'activar' ? (
        <>
          <Typography variant="h6" fontSize={17} mb={0.5}>¡Primera vez! Creá tu contraseña</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Tu DNI está registrado en el gym. Elegí una contraseña para tu cuenta.
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h6" fontSize={17} mb={0.5}>Ingresá a tu cuenta</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Check-in, tu rutina con animaciones y tu carnet digital.
          </Typography>
        </>
      )}

      <Box display="flex" flexDirection="column" gap={1.5} maxWidth={280} mx="auto">
        <TextField
          placeholder="Tu DNI"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          disabled={paso === 'activar'}
          autoFocus={compacto}
          inputProps={{ inputMode: 'numeric', autoComplete: 'username', 'aria-label': 'DNI', style: { textAlign: 'center', fontWeight: 700, letterSpacing: 1 } }}
        />
        <TextField
          placeholder={paso === 'activar' ? 'Nueva contraseña' : 'Contraseña'}
          type={verPass ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && paso === 'login' && entrar()}
          inputProps={{ autoComplete: paso === 'activar' ? 'new-password' : 'current-password', 'aria-label': 'Contraseña', style: { textAlign: 'center' } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setVerPass((v) => !v)} edge="end" aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {verPass ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {paso === 'activar' && (
          <TextField
            placeholder="Repetí la contraseña"
            type={verPass ? 'text' : 'password'}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
            inputProps={{ autoComplete: 'new-password', 'aria-label': 'Repetir contraseña', style: { textAlign: 'center' } }}
          />
        )}
        <Button variant="contained" size="large" onClick={entrar} disabled={cargando || !dni.trim() || !password}>
          {cargando ? <CircularProgress size={22} color="inherit" />
            : paso === 'activar' ? 'Crear y entrar' : 'Ingresar'}
        </Button>
        {error && <Typography variant="body2" role="alert" sx={{ color: '#F87171' }}>{error}</Typography>}
        {paso === 'activar' && (
          <Button size="small" onClick={() => { setPaso('login'); setError(''); }} sx={{ color: 'text.secondary' }}>
            Volver
          </Button>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" mt={2}>
        ¿Olvidaste tu contraseña? Pedí en recepción que te la reseteen.
      </Typography>
    </>
  );

  if (compacto) return <Box sx={{ textAlign: 'center' }}>{formulario}</Box>;

  return (
    <Paper sx={{ p: 3, mb: 2, textAlign: 'center', animation: 'sube 0.45s 0.06s ease-out both' }}>
      <Box sx={{
        width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 1.5,
        bgcolor: ACENTO_SUAVE, border: `2px solid ${ACENTO}`, boxShadow: BRILLO,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BadgeIcon sx={{ color: ACENTO, fontSize: 28 }} />
      </Box>
      {formulario}
    </Paper>
  );
}
