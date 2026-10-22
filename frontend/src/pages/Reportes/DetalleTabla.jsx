import { useMemo, useState, useEffect } from 'react';
import {
  Box, TextField, InputAdornment, Table, TableBody, TableCell, TableHead, TableRow,
  TablePagination, Skeleton, Alert, Button, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

/* Tabla de detalle (pagos / asistencias): paginada en cliente, con buscador.
   columnas: [{ clave, titulo, align?, render?(fila) }]; textoBusqueda(fila) -> string. */
export default function DetalleTabla({ columnas, filas, textoBusqueda, cargando, error, onReintentar, vacio, resumen }) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(25);

  useEffect(() => { setPagina(0); }, [busqueda, filas]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return filas || [];
    return (filas || []).filter((f) => textoBusqueda(f).toLowerCase().includes(q));
  }, [filas, busqueda, textoBusqueda]);

  const visibles = filtradas.slice(pagina * porPagina, pagina * porPagina + porPagina);

  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={onReintentar}>Reintentar</Button>}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap" mb={1.5}>
        <TextField
          placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 260 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          inputProps={{ 'aria-label': 'Buscar en el detalle' }}
        />
        {resumen && !cargando && <Typography variant="body2" color="text.secondary">{resumen(filtradas)}</Typography>}
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              {columnas.map((c) => <TableCell key={c.clave} align={c.align || 'left'}>{c.titulo}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {columnas.map((c) => <TableCell key={c.clave}><Skeleton /></TableCell>)}
                </TableRow>
              ))
            ) : visibles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas.length} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {busqueda ? 'Sin resultados para la búsqueda' : vacio}
                </TableCell>
              </TableRow>
            ) : (
              visibles.map((f) => (
                <TableRow key={f.id} hover>
                  {columnas.map((c) => (
                    <TableCell key={c.clave} align={c.align || 'left'} sx={c.align === 'right' ? { fontVariantNumeric: 'tabular-nums' } : undefined}>
                      {c.render ? c.render(f) : (f[c.clave] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {!cargando && filtradas.length > 0 && (
        <TablePagination
          component="div" count={filtradas.length} page={pagina} rowsPerPage={porPagina}
          onPageChange={(_, p) => setPagina(p)}
          onRowsPerPageChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(0); }}
          rowsPerPageOptions={[25, 50, 100]} labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      )}
    </Box>
  );
}
