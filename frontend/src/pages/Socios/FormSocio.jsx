import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Grid, Paper,
  CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel, Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';
import SocioAvatar from '../../components/SocioAvatar';

const INIT = { nombre: '', apellido: '', email: '', telefono: '', dni: '', observaciones: '', estado: 'ACTIVO', sexo: 'OTROS' };

export default function FormSocio() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);
  const [form, setForm]           = useState(INIT);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [fotoPreview, setFotoPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadOk, setUploadOk]   = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (isEdit) {
      api.get(`/socios/${id}`).then(r => {
        const { pagos, ...datos } = r.data;
        setForm({ ...INIT, ...datos });
        if (datos.foto) setFotoPreview(datos.foto);
      });
    }
  }, [id]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/socios/${id}`, form);
        setSuccess('Socio actualizado correctamente');
      } else {
        const { data } = await api.post('/socios', form);
        navigate(`/socios/${data.id}`);
      }
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  const handleQuitarFoto = async () => {
    try {
      await api.put(`/socios/${id}`, { foto: null });
      setFotoPreview(null);
      setPendingFile(null);
      setUploadOk(false);
      setSuccess('Foto eliminada');
    } catch {
      setError('Error al quitar la foto');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoPreview(URL.createObjectURL(file));
    setPendingFile(file);
    setUploadOk(false);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('foto', pendingFile);
      await api.post(`/socios/${id}/foto`, fd);
      setPendingFile(null);
      setUploadOk(true);
    } catch {
      setError('Error al subir la foto. Intentá de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const socioPreview = { ...form, foto: fotoPreview };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/socios')}>Volver</Button>
        <Typography variant="h5" fontWeight={700}>{isEdit ? 'Editar socio' : 'Nuevo socio'}</Typography>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {isEdit && (
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <SocioAvatar socio={socioPreview} size={120} sx={{ mx: 'auto', mb: 2, fontSize: 40 }} />

              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />

              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraIcon />}
                onClick={() => fileRef.current.click()}
                fullWidth
                sx={{ mb: 1 }}
              >
                Seleccionar foto
              </Button>

              {pendingFile && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <CloudUploadIcon />}
                  onClick={handleUpload}
                  disabled={uploading}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  {uploading ? 'Subiendo…' : 'Subir foto'}
                </Button>
              )}

              {fotoPreview && !pendingFile && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleQuitarFoto}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Quitar foto
                </Button>
              )}

              {uploadOk && (
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="caption" color="success.main" fontWeight={600}>
                    Subida con éxito
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} md={isEdit ? 9 : 12}>
          <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="DNI" name="dni" value={form.dni || ''} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Teléfono" name="telefono" value={form.telefono || ''} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" name="email" type="email" value={form.email || ''} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sexo</InputLabel>
                  <Select label="Sexo" name="sexo" value={form.sexo || 'OTROS'} onChange={handleChange}>
                    <MenuItem value="MASCULINO">Masculino</MenuItem>
                    <MenuItem value="FEMENINO">Femenino</MenuItem>
                    <MenuItem value="OTROS">Otros</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {isEdit && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select label="Estado" name="estado" value={form.estado} onChange={handleChange}>
                      <MenuItem value="ACTIVO">Activo</MenuItem>
                      <MenuItem value="INACTIVO">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField label="Observaciones" name="observaciones" value={form.observaciones || ''} onChange={handleChange} multiline rows={3} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" disabled={loading} size="large">
                  {loading ? <CircularProgress size={22} color="inherit" /> : (isEdit ? 'Guardar cambios' : 'Crear socio')}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
