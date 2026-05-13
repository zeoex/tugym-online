import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert, CircularProgress, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../../services/api';

const diasRestantes = (fecha) => Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));

export default function Vencimientos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dias, setDias] = useState(3);

  const cargar = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/pagos/proximos?dias=${dias}`); setPagos(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [dias]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <WarningAmberIcon color="warning" />
          <Typography variant="h5" fontWeight={700}>Vencimientos próximos</Typography>
        </Box>
        <Box display="flex" gap={1}>
          {[3, 7, 15].map(d => (
            <Button key={d} variant={dias === d ? 'contained' : 'outlined'} size="small" onClick={() => setDias(d)}>
              {d} días
            </Button>
          ))}
          <Button startIcon={<RefreshIcon />} onClick={cargar} size="small">Actualizar</Button>
        </Box>
      </Box>

      {pagos.length === 0 && !loading && (
        <Alert severity="success">No hay socios próximos a vencer en los próximos {dias} días.</Alert>
      )}

      {pagos.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {pagos.length} socio(s) vencen en los próximos {dias} días.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Socio', 'Teléfono', 'Plan', 'Vencimiento', 'Días restantes'].map(h => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={28} sx={{ my: 2 }} /></TableCell></TableRow>
            ) : pagos.map(p => {
              const dias = diasRestantes(p.fechaVencimiento);
              return (
                <TableRow key={p.id} hover>
                  <TableCell><Typography fontWeight={500}>{p.socio?.apellido}, {p.socio?.nombre}</Typography><Typography variant="caption" color="text.secondary">{p.socio?.email}</Typography></TableCell>
                  <TableCell>{p.socio?.telefono || '-'}</TableCell>
                  <TableCell>{p.plan?.nombre}</TableCell>
                  <TableCell>{new Date(p.fechaVencimiento).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell>
                    <Chip label={dias <= 0 ? 'HOY' : `${dias} día(s)`} color={dias <= 1 ? 'error' : dias <= 3 ? 'warning' : 'info'} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
