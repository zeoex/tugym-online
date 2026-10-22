import { useState } from 'react';
import {
  Box, Typography, Button, TextField, CircularProgress, MenuItem,
  InputAdornment, IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ACENTO } from '../../theme';
import { portalApi } from './portalApi';

const INIT = { nombre: '', apellido: '', dni: '', telefono: '', email: '', sexo: 'OTROS', mensaje: '', password: '' };

/* Pedido de alta: el visitante deja sus datos y elige su contraseña; el gym
   lo aprueba desde el admin y recién ahí existe como socio. */
export default function SolicitudSocioForm({ onIngresar }) {
  const [form, setForm] = useState(INIT);
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(null); // { mensaje, yaPendiente }

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const completo = form.nombre.trim() && form.apellido.trim() && form.dni.trim() && form.password.length >= 4;

  const enviar = async (e) => {
    e.preventDefault();
    if (!completo) return;
    setError('');
    setCargando(true);
    try {
      const { data } = await portalApi.post('/solicitudes', {
        ...form,
        nombre: form.nombre.trim(), apellido: form.apellido.trim(), dni: form.dni.trim(),
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim() || undefined,
        mensaje: form.mensaje.trim() || undefined,
      });
      setListo(data);
    } catch (err) {
      const r = err.response?.data;
      setError(r?.error || 'No pudimos enviar tu solicitud. Probá de nuevo en un rato.');
      if (r?.yaSocio) setError(`${r.error}`);
    } finally {
      setCargando(false);
    }
  };

  if (listo) {
    return (
      <Box sx={{ textAlign: 'center', py: 1 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 1.5,
          bgcolor: 'rgba(200,241,63,0.12)', border: `2px solid ${ACENTO}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircleIcon sx={{ color: ACENTO, fontSize: 30 }} />
        </Box>
        <Typography variant="h6" fontSize={18} mb={0.5}>
          {listo.yaPendiente ? 'Tu solicitud ya está en revisión' : '¡Solicitud enviada!'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto' }}>
          {listo.mensaje}
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={enviar} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" fontSize={17} mb={0.5}>Quiero ser socio</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Dejanos tus datos y elegí una contraseña. El gym revisa tu pedido y, cuando lo apruebe,
        entrás con tu DNI.
      </Typography>

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, textAlign: 'left' }}>
        <TextField label="Nombre" value={form.nombre} onChange={set('nombre')} required inputProps={{ autoComplete: 'given-name', maxLength: 60 }} />
        <TextField label="Apellido" value={form.apellido} onChange={set('apellido')} required inputProps={{ autoComplete: 'family-name', maxLength: 60 }} />
        <TextField label="DNI" value={form.dni} onChange={set('dni')} required inputProps={{ inputMode: 'numeric', maxLength: 11 }} helperText="Sin puntos" />
        <TextField label="Celular" value={form.telefono} onChange={set('telefono')} inputProps={{ inputMode: 'tel', autoComplete: 'tel', maxLength: 30 }} />
        <TextField label="Email" type="email" value={form.email} onChange={set('email')} inputProps={{ autoComplete: 'email', maxLength: 120 }} />
        <TextField select label="Sexo" value={form.sexo} onChange={set('sexo')}>
          <MenuItem value="MASCULINO">Masculino</MenuItem>
          <MenuItem value="FEMENINO">Femenino</MenuItem>
          <MenuItem value="OTROS">Prefiero no decir</MenuItem>
        </TextField>
        <TextField
          label="Contraseña para el portal"
          type={verPass ? 'text' : 'password'}
          value={form.password} onChange={set('password')} required
          helperText="Mínimo 4 caracteres"
          inputProps={{ autoComplete: 'new-password', maxLength: 64 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" edge="end" onClick={() => setVerPass((v) => !v)} aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {verPass ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField label="¿Algo que quieras contarnos?" value={form.mensaje} onChange={set('mensaje')} multiline minRows={1} maxRows={3}
          inputProps={{ maxLength: 300 }} placeholder="Horario que te viene bien, objetivo, lesiones…" />
      </Box>

      <Button type="submit" variant="contained" size="large" disabled={cargando || !completo}
        sx={{ mt: 2, minWidth: 220, minHeight: 48 }}>
        {cargando ? <CircularProgress size={22} color="inherit" /> : 'Enviar solicitud'}
      </Button>
      {error && (
        <Typography variant="body2" role="alert" sx={{ color: '#F87171', mt: 1.5 }}>
          {error}{' '}
          {/^Ese DNI ya es socio/.test(error) && onIngresar && (
            <Box component="button" type="button" onClick={onIngresar}
              sx={{ background: 'none', border: 0, p: 0, color: ACENTO, cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}>
              Ingresar
            </Box>
          )}
        </Typography>
      )}
    </Box>
  );
}
