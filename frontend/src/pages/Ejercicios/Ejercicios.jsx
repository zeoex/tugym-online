import { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Alert,
  CircularProgress, LinearProgress, Table, TableHead, TableBody, TableRow, TableCell,
  InputAdornment, Divider, useTheme, useMediaQuery,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import MovieIcon from '@mui/icons-material/Movie';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RestoreIcon from '@mui/icons-material/Restore';
import api from '../../services/api';
import { ACENTO, ACENTO_SUAVE, INK } from '../../theme';

const FORM_INIT = { nombre: '', musculo: '', categoria: 'CUERPO', descripcion: '' };
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_IMAGENES = 12;
const MAX_VIDEOS = 10;
const MAX_DESCRIPCION = 1000;

/* Mismo criterio que el backend: watch?v=, youtu.be/, shorts/, embed/, v/, live/ → 11 chars [A-Za-z0-9_-] */
const YT_RE = /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|v\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/;
export function youtubeId(url) {
  if (!url) return null;
  const m = String(url).trim().match(YT_RE);
  return m ? m[1] : null;
}
const ytThumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

const esGif = (url) => /\.gif(\?|$)/i.test(url || '');
const datosDe = (e) => ({
  nombre: e.nombre, musculo: e.musculo || null, mediaKey: e.mediaKey || null,
  categoria: e.categoria || 'CUERPO', videos: e.videos || [], descripcion: e.descripcion || '',
});

let contadorItem = 0;
const nuevoItemUrl = (url) => ({ k: `u${++contadorItem}`, url });
const nuevoItemArchivo = (file) => ({ k: `f${++contadorItem}`, file, preview: URL.createObjectURL(file), progreso: null, error: null });

/* ── Chips de la columna Demo ───────────────────────────────────────── */
function ChipsDemo({ e, isMobile }) {
  const nImg = e.imagenes?.length ?? 0;
  const nVid = e.videos?.length ?? 0;
  const chips = [];
  if (nImg) {
    const todosGif = e.imagenes.every(esGif);
    const label = nImg === 1 ? (todosGif ? 'GIF propio' : 'Imagen propia') : `${nImg} ${todosGif ? 'GIFs' : 'imágenes'}`;
    chips.push(
      <Chip key="img" icon={<ImageIcon sx={{ fontSize: 14 }} />} label={label} size="small"
        sx={{ bgcolor: ACENTO, color: INK, fontWeight: 700, fontSize: 11, '& .MuiChip-icon': { color: INK } }} />
    );
  }
  if (nVid) {
    chips.push(
      <Chip key="vid" icon={<YouTubeIcon sx={{ fontSize: 15 }} />} label={nVid === 1 ? 'Video' : `${nVid} videos`} size="small"
        color="error" sx={{ fontWeight: 700, fontSize: 11 }} />
    );
  }
  if (e.media?.origen === 'CATALOGO' && e.media?.gif) {
    chips.push(
      <Chip key="cat" icon={<MovieIcon sx={{ fontSize: 14 }} />} label={isMobile ? 'GIF' : 'Catálogo'} size="small"
        sx={{ bgcolor: ACENTO, color: INK, fontWeight: 700, fontSize: 11, '& .MuiChip-icon': { color: INK } }} />
    );
  } else if (!nImg && e.mediaKey && !e.media?.gif) {
    chips.push(<Chip key="pend" label="Pendiente" size="small" sx={{ fontWeight: 600, fontSize: 11 }} />);
  }
  if (!chips.length) {
    chips.push(<Chip key="sin" label="Sin demo" size="small" variant="outlined" sx={{ fontSize: 11, color: 'text.disabled' }} />);
  }
  return (
    <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
      {e.media?.gif && (
        <Box component="img" src={e.media.gif} alt="" loading="lazy"
          sx={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: 'divider', flexShrink: 0 }} />
      )}
      {chips}
    </Box>
  );
}

function TituloSeccion({ children, sub }) {
  return (
    <Box>
      <Typography variant="overline" fontWeight={800} letterSpacing={1} color="text.secondary" lineHeight={1.4}>{children}</Typography>
      {sub && <Typography variant="caption" color="text.secondary" display="block">{sub}</Typography>}
    </Box>
  );
}

/* ── Página ─────────────────────────────────────────────────────────── */
export default function Ejercicios({ embebido = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const tapSx = isMobile ? { minWidth: 44, minHeight: 44 } : {};

  const [ejercicios, setEjercicios] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('TODOS');
  const [aviso, setAviso] = useState('');
  const avisoRef = useRef(null);

  // Dialog crear/editar
  const [dialog, setDialog] = useState(null); // { ejercicio? } — null cerrado, {} nuevo
  const [form, setForm] = useState(FORM_INIT);
  const [animSel, setAnimSel] = useState(null);
  const [opcionesAnim, setOpcionesAnim] = useState([]);
  const [buscandoAnim, setBuscandoAnim] = useState(false);
  const [galeria, setGaleria] = useState([]);      // [{k,url} | {k,file,preview,progreso,error}]
  const [quitadas, setQuitadas] = useState([]);    // urls existentes a borrar al guardar
  const [videos, setVideos] = useState([]);
  const [videoInput, setVideoInput] = useState('');
  const [videoError, setVideoError] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [paso, setPaso] = useState('');            // texto de progreso del guardado
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // Dialog eliminar
  const [borrar, setBorrar] = useState(null); // { ejercicio, usos: null|number, cargando, error }
  const [reactivando, setReactivando] = useState(null);

  const mostrarAviso = (texto) => {
    setAviso(texto);
    clearTimeout(avisoRef.current);
    avisoRef.current = setTimeout(() => setAviso(''), 4000);
  };

  // Una sola carga con inactivos=1: los desactivados se filtran en el cliente
  const cargar = () => api.get('/ejercicios', { params: { inactivos: 1 } })
    .then((r) => { setEjercicios(r.data); setErrorCarga(''); })
    .catch(() => setErrorCarga('No se pudo cargar la biblioteca de ejercicios'));
  useEffect(() => { cargar(); }, []);

  // Buscador del catálogo del dataset (1.324 animaciones) con debounce
  const buscarAnim = (texto) => {
    clearTimeout(timerRef.current);
    if (!texto || texto.length < 2) { setOpcionesAnim([]); return; }
    timerRef.current = setTimeout(async () => {
      setBuscandoAnim(true);
      try {
        const { data } = await api.get('/ejercicios/catalogo', { params: { q: texto } });
        setOpcionesAnim(data);
      } catch { setOpcionesAnim([]); }
      finally { setBuscandoAnim(false); }
    }, 350);
  };

  const liberarPreviews = (items) => items.forEach((it) => { if (it.preview) URL.revokeObjectURL(it.preview); });

  const abrir = (ejercicio = null) => {
    setError(''); setVideoError(''); setVideoInput(''); setPaso('');
    liberarPreviews(galeria);
    if (ejercicio) {
      setForm({ nombre: ejercicio.nombre, musculo: ejercicio.musculo || '', categoria: ejercicio.categoria || 'CUERPO', descripcion: ejercicio.descripcion || '' });
      setAnimSel(ejercicio.mediaKey
        ? { key: ejercicio.mediaKey, nombreEn: ejercicio.media?.nombreEn || ejercicio.mediaKey, gifPreview: ejercicio.media?.origen === 'CATALOGO' ? ejercicio.media?.gif : undefined }
        : null);
      setGaleria((ejercicio.imagenes || []).map(nuevoItemUrl));
      setVideos(ejercicio.videos || []);
    } else {
      setForm(FORM_INIT);
      setAnimSel(null);
      setGaleria([]);
      setVideos([]);
    }
    setQuitadas([]);
    setOpcionesAnim([]);
    setDialog({ ejercicio });
  };

  const cerrar = () => {
    if (guardando) return;
    liberarPreviews(galeria);
    setDialog(null);
  };

  /* ── Galería ── */
  const agregarArchivos = (fileList) => {
    const archivos = Array.from(fileList || []);
    if (!archivos.length) return;
    setError('');
    const rechazados = [];
    setGaleria((prev) => {
      let lugar = MAX_IMAGENES - prev.length;
      const nuevos = [];
      for (const f of archivos) {
        const tipoOk = TIPOS_IMAGEN.includes(f.type) || /\.(jpe?g|png|webp|gif)$/i.test(f.name);
        if (!tipoOk) { rechazados.push(`${f.name}: solo JPG, PNG, WEBP o GIF`); continue; }
        if (f.size > MAX_BYTES) { rechazados.push(`${f.name}: supera 8 MB`); continue; }
        if (lugar <= 0) { rechazados.push(`${f.name}: máximo ${MAX_IMAGENES} imágenes por ejercicio`); continue; }
        lugar -= 1;
        nuevos.push(nuevoItemArchivo(f));
      }
      return [...prev, ...nuevos];
    });
    if (rechazados.length) setError(rechazados.join(' · '));
    if (inputRef.current) inputRef.current.value = '';
  };

  const quitarItem = (k) => {
    setGaleria((prev) => {
      const it = prev.find((x) => x.k === k);
      if (!it) return prev;
      if (it.url) setQuitadas((qs) => [...qs, it.url]);
      if (it.preview) URL.revokeObjectURL(it.preview);
      return prev.filter((x) => x.k !== k);
    });
  };

  const moverItem = (i, dir) => {
    setGaleria((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  };

  /* ── Videos ── */
  const agregarVideo = () => {
    const id = youtubeId(videoInput);
    if (!id) { setVideoError('Pegá un link de YouTube válido (watch, youtu.be o shorts)'); return; }
    if (videos.length >= MAX_VIDEOS) { setVideoError(`Máximo ${MAX_VIDEOS} videos por ejercicio`); return; }
    const url = videoInput.trim();
    if (videos.some((v) => youtubeId(v) === id)) { setVideoError('Ese video ya está en la lista'); return; }
    setVideos((prev) => [...prev, url]);
    setVideoInput(''); setVideoError('');
  };

  /* ── Guardar: datos → bajas de imágenes → subidas de a una → reorden ── */
  const guardar = async () => {
    setError('');
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (form.descripcion.length > MAX_DESCRIPCION) { setError(`La descripción supera los ${MAX_DESCRIPCION} caracteres`); return; }
    if (videoInput.trim() && !youtubeId(videoInput)) { setError('Hay un link de video sin agregar que no es de YouTube. Agregalo o borralo.'); return; }

    setGuardando(true);
    const payload = {
      nombre: form.nombre.trim(), musculo: form.musculo.trim() || null, mediaKey: animSel?.key || null,
      categoria: form.categoria, videos, descripcion: form.descripcion.trim(),
    };
    // Si quedó un link válido sin "Agregar", lo sumamos igual
    if (videoInput.trim() && youtubeId(videoInput) && !videos.some((v) => youtubeId(v) === youtubeId(videoInput))) {
      payload.videos = [...videos, videoInput.trim()];
    }

    let id = dialog.ejercicio?.id;
    let ejercicioGuardado = dialog.ejercicio;
    try {
      setPaso('Guardando datos…');
      if (id) ({ data: ejercicioGuardado } = await api.put(`/ejercicios/${id}`, payload));
      else { ({ data: ejercicioGuardado } = await api.post('/ejercicios', payload)); id = ejercicioGuardado.id; }
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo guardar');
      setGuardando(false); setPaso('');
      return;
    }

    const fallas = [];
    // 1) Bajas
    for (const url of quitadas) {
      try {
        setPaso('Quitando imágenes…');
        await api.delete(`/ejercicios/${id}/imagenes`, { params: { url } });
      } catch (e) {
        fallas.push(`No se pudo quitar una imagen: ${e.response?.data?.error || 'error de red'}`);
      }
    }
    setQuitadas([]);

    // 2) Subidas, de a un archivo para tener progreso y error por archivo
    let items = galeria;
    const pendientes = items.filter((it) => it.file);
    let subidos = 0;
    for (const it of pendientes) {
      setPaso(`Subiendo imagen ${subidos + 1} de ${pendientes.length}…`);
      const fd = new FormData();
      fd.append('imagenes', it.file);
      try {
        const { data } = await api.post(`/ejercicios/${id}/imagenes`, fd, {
          onUploadProgress: (ev) => {
            const pct = ev.total ? Math.round((ev.loaded * 100) / ev.total) : 50;
            setGaleria((prev) => prev.map((x) => x.k === it.k ? { ...x, progreso: pct, error: null } : x));
          },
        });
        const urlNueva = data.imagenes?.[data.imagenes.length - 1];
        subidos += 1;
        items = items.map((x) => x.k === it.k ? (urlNueva ? { k: x.k, url: urlNueva } : x) : x);
        if (it.preview) URL.revokeObjectURL(it.preview);
        setGaleria(items);
      } catch (e) {
        const msg = e.response?.data?.error || 'error al subir';
        fallas.push(`${it.file.name}: ${msg}`);
        items = items.map((x) => x.k === it.k ? { ...x, progreso: null, error: msg } : x);
        setGaleria(items);
      }
    }

    // 3) Reorden si el orden de la UI difiere del que quedó en el servidor
    const ordenUi = items.filter((it) => it.url).map((it) => it.url);
    const ordenServidor = [
      ...(dialog.ejercicio?.imagenes || []).filter((u) => !quitadas.includes(u)),
      ...items.filter((it) => it.url && !(dialog.ejercicio?.imagenes || []).includes(it.url)).map((it) => it.url),
    ];
    if (ordenUi.length && ordenUi.join('\n') !== ordenServidor.join('\n')) {
      try {
        setPaso('Ordenando imágenes…');
        await api.put(`/ejercicios/${id}/imagenes`, { imagenes: ordenUi });
      } catch (e) {
        fallas.push(`No se pudo guardar el orden: ${e.response?.data?.error || 'error de red'}`);
      }
    }

    setGuardando(false); setPaso('');
    cargar();
    if (fallas.length) {
      // El ejercicio quedó guardado: pasamos a modo edición para reintentar lo que falló
      setDialog({ ejercicio: { ...(ejercicioGuardado || {}), id, ...payload, imagenes: ordenUi } });
      setError(`El ejercicio se guardó, pero: ${fallas.join(' · ')}. Podés reintentar con Guardar.`);
      return;
    }
    setDialog(null);
    mostrarAviso(dialog.ejercicio ? 'Ejercicio actualizado' : 'Ejercicio creado');
  };

  /* ── Eliminar / desactivar / reactivar ── */
  const confirmarBorrar = async (forzar = false) => {
    setBorrar((p) => ({ ...p, cargando: true, error: '' }));
    try {
      const { data } = await api.delete(`/ejercicios/${borrar.ejercicio.id}`, forzar ? { params: { forzar: 1 } } : undefined);
      setBorrar(null);
      mostrarAviso(data.mensaje || 'Ejercicio eliminado');
      cargar();
    } catch (e) {
      if (e.response?.status === 409) {
        setBorrar((p) => ({ ...p, cargando: false, usos: e.response.data?.usos ?? borrar.ejercicio.usos ?? 0 }));
      } else {
        setBorrar((p) => ({ ...p, cargando: false, error: e.response?.data?.error || 'No se pudo eliminar' }));
      }
    }
  };

  const desactivar = async () => {
    setBorrar((p) => ({ ...p, cargando: true, error: '' }));
    try {
      await api.put(`/ejercicios/${borrar.ejercicio.id}`, { ...datosDe(borrar.ejercicio), activo: false });
      setBorrar(null);
      mostrarAviso(`"${borrar.ejercicio.nombre}" desactivado: no se ofrece más, las rutinas que lo usan siguen igual`);
      cargar();
    } catch (e) {
      setBorrar((p) => ({ ...p, cargando: false, error: e.response?.data?.error || 'No se pudo desactivar' }));
    }
  };

  const reactivar = async (ejercicio) => {
    setReactivando(ejercicio.id);
    try {
      await api.put(`/ejercicios/${ejercicio.id}`, { ...datosDe(ejercicio), activo: true });
      mostrarAviso(`"${ejercicio.nombre}" reactivado`);
      cargar();
    } catch (e) {
      setErrorCarga(e.response?.data?.error || 'No se pudo reactivar');
    } finally {
      setReactivando(null);
    }
  };

  /* ── Filtros ── */
  const esPropio = (e) => (e.imagenes?.length ?? 0) > 0 || (e.videos?.length ?? 0) > 0 || e.media?.origen === 'PROPIA';
  const activos = ejercicios?.filter((e) => e.activo !== false);
  const inactivos = ejercicios?.filter((e) => e.activo === false);
  const base = cat === 'DESACTIVADOS' ? inactivos : activos;
  const filtrados = base?.filter((e) =>
    (cat === 'TODOS' || cat === 'DESACTIVADOS' || (cat === 'PROPIOS' ? esPropio(e) : e.categoria === cat)) &&
    (!q || e.nombre.toLowerCase().includes(q.toLowerCase()) || (e.musculo || '').toLowerCase().includes(q.toLowerCase()))
  );
  const visibles = filtrados?.slice(0, 300);
  const nCuerpo = activos?.filter((e) => e.categoria === 'CUERPO').length ?? 0;
  const nCalent = activos?.filter((e) => e.categoria === 'CALENTAMIENTO').length ?? 0;
  const nPropios = activos?.filter(esPropio).length ?? 0;
  const nInactivos = inactivos?.length ?? 0;

  const botonNuevo = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrir()} sx={{ flexShrink: 0, ...tapSx }}>
      {isMobile ? 'Nuevo' : 'Nuevo ejercicio'}
    </Button>
  );

  return (
    <Box>
      {embebido ? (
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={2}>
          <Typography variant="body2" color="text.secondary">
            La biblioteca completa del gym{ejercicios ? ` (${activos.length})` : ''}. Cargá los tuyos con fotos, GIFs o videos de YouTube.
          </Typography>
          {botonNuevo}
        </Box>
      ) : (<>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5} gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h4" fontSize={26}>Ejercicios</Typography>
            {activos && <Chip label={activos.length} size="small" sx={{ fontWeight: 700 }} />}
          </Box>
          {botonNuevo}
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          La biblioteca del gym. Cargá los tuyos con fotos, GIFs o videos de YouTube. Renombrá tranquilo: la demo queda vinculada por ID, no por nombre.
        </Typography>
      </>)}

      {aviso && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorCarga && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorCarga('')}
          action={<Button color="inherit" size="small" onClick={cargar}>Reintentar</Button>}>
          {errorCarga}
        </Alert>
      )}

      <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap" mb={2}>
        <TextField
          placeholder="Buscar por nombre o músculo…"
          value={q} onChange={(e) => setQ(e.target.value)}
          sx={{ maxWidth: 380, flex: 1, minWidth: 240 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 19 }} /></InputAdornment> }}
        />
        {[
          { valor: 'TODOS', label: `Todos (${activos?.length ?? 0})` },
          { valor: 'CUERPO', label: `Cuerpo (${nCuerpo})` },
          { valor: 'CALENTAMIENTO', label: `Calentamiento (${nCalent})` },
          { valor: 'PROPIOS', label: `Propios (${nPropios})` },
          { valor: 'DESACTIVADOS', label: `Desactivados (${nInactivos})` },
        ].map((c) => (
          <Chip
            key={c.valor}
            label={c.label}
            onClick={() => setCat(c.valor)}
            sx={cat === c.valor
              ? { bgcolor: ACENTO, color: INK, fontWeight: 800 }
              : { fontWeight: 600 }}
          />
        ))}
      </Box>

      {!filtrados ? (
        !errorCarga && <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ejercicio</TableCell>
                {!isMobile && <TableCell>Músculo</TableCell>}
                <TableCell>Demo</TableCell>
                {!isMobile && <TableCell align="center">En rutinas</TableCell>}
                <TableCell align="right" width={isMobile ? 100 : 110} />
              </TableRow>
            </TableHead>
            <TableBody>
              {visibles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                      {cat === 'DESACTIVADOS' ? 'No hay ejercicios desactivados' : 'No hay ejercicios que coincidan'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {visibles.map((e) => {
                const inactivo = e.activo === false;
                return (
                  <TableRow key={e.id} hover sx={inactivo ? { '& > td': { opacity: 0.55 } } : undefined}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13.5 }}>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        {e.nombre}
                        {inactivo && <Chip label="Desactivado" size="small" sx={{ fontSize: 10, height: 18, fontWeight: 700 }} />}
                      </Box>
                      {isMobile && e.musculo && (
                        <Typography variant="caption" display="block" color="text.secondary">{e.musculo}</Typography>
                      )}
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" component="span">{e.musculo || '—'}</Typography>
                        {e.categoria === 'CALENTAMIENTO' && (
                          <Chip label="Calent." size="small" sx={{ ml: 1, fontSize: 10, height: 18, fontWeight: 700 }} />
                        )}
                      </TableCell>
                    )}
                    <TableCell><ChipsDemo e={e} isMobile={isMobile} /></TableCell>
                    {!isMobile && <TableCell align="center"><Typography variant="body2" color="text.secondary">{e.usos}</Typography></TableCell>}
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {inactivo && (
                        <Tooltip title="Reactivar">
                          <span>
                            <IconButton size="small" color="success" onClick={() => reactivar(e)} disabled={reactivando === e.id} sx={tapSx}>
                              {reactivando === e.id ? <CircularProgress size={16} /> : <RestoreIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar"><IconButton size="small" onClick={() => abrir(e)} sx={tapSx}><EditIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => setBorrar({ ejercicio: e, usos: null, cargando: false, error: '' })} sx={tapSx}>
                          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtrados.length > visibles.length && (
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" py={1.5}>
              Mostrando {visibles.length} de {filtrados.length} — afiná la búsqueda para ver el resto
            </Typography>
          )}
        </Paper>
      )}

      {/* ── Crear / editar ── */}
      <Dialog open={Boolean(dialog)} onClose={cerrar} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FitnessCenterIcon color="primary" /> {dialog?.ejercicio ? 'Editar ejercicio' : 'Nuevo ejercicio'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2.5} mt={1}>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            {/* Datos */}
            <TituloSeccion>Datos</TituloSeccion>
            <TextField label="Nombre" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} fullWidth autoFocus />
            <Box display="flex" gap={2}>
              <TextField label="Músculo" value={form.musculo} onChange={(e) => setForm((p) => ({ ...p, musculo: e.target.value }))}
                placeholder="Pecho, Glúteos, Core…" sx={{ flex: 1 }} />
              <TextField select label="Categoría" value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                SelectProps={{ native: true }} sx={{ width: 170 }}>
                <option value="CUERPO">Cuerpo</option>
                <option value="CALENTAMIENTO">Calentamiento</option>
              </TextField>
            </Box>

            <Divider />

            {/* Demostración: catálogo */}
            <TituloSeccion sub="Se pueden combinar. Si cargás imágenes propias, la portada le gana a la del catálogo; los videos se abren en el portal del socio.">
              Demostración
            </TituloSeccion>
            <Autocomplete
              options={opcionesAnim}
              value={animSel}
              onChange={(_e, v) => setAnimSel(v)}
              onInputChange={(_e, texto, motivo) => { if (motivo === 'input') buscarAnim(texto); }}
              getOptionLabel={(o) => o.nombreEn || ''}
              isOptionEqualToValue={(a, b) => a.key === b.key}
              filterOptions={(x) => x}
              loading={buscandoAnim}
              noOptionsText="Escribí en inglés: bench press, squat, curl…"
              renderOption={(props, o) => (
                <li {...props} key={o.key}>
                  <Box display="flex" alignItems="center" gap={1.5} width="100%">
                    <Box component="img" src={o.gifPreview} alt="" loading="lazy"
                      sx={{ width: 54, height: 54, objectFit: 'contain', borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }} />
                    <Box minWidth={0}>
                      <Typography fontSize={13.5} fontWeight={600} noWrap>{o.nombreEn}</Typography>
                      <Typography variant="caption" color="text.secondary">{o.musculo} · {o.equipo}</Typography>
                    </Box>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Animación del catálogo (1.324)"
                  helperText="Buscá en inglés y elegí el GIF. Se descarga solo la primera vez."
                  InputProps={{ ...params.InputProps, endAdornment: (<>{buscandoAnim ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>) }} />
              )}
            />
            {animSel?.gifPreview && (
              <Box component="img" src={animSel.gifPreview} alt={animSel.nombreEn}
                sx={{ maxHeight: 160, objectFit: 'contain', borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider', alignSelf: 'center' }} />
            )}

            {/* Demostración: imágenes propias */}
            <Box>
              <Typography variant="subtitle2" mb={0.25}>Imágenes y GIFs propios</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.25}>
                Hasta {MAX_IMAGENES}, de 8 MB cada una. La primera es la portada: es la que ve el socio primero. Usá las flechas para ordenar.
                {!dialog?.ejercicio && ' Se suben al guardar, después de crear el ejercicio.'}
              </Typography>

              {galeria.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 1.25, mb: 1.5 }}>
                  {galeria.map((it, i) => (
                    <Paper key={it.k} variant="outlined"
                      sx={{ p: 0.75, borderRadius: 2, position: 'relative', borderColor: it.error ? 'error.main' : 'divider', opacity: it.progreso != null ? 0.85 : 1 }}>
                      <Box component="img" src={it.url || it.preview} alt=""
                        sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain', borderRadius: 1, bgcolor: '#fff', display: 'block' }} />
                      {i === 0 && (
                        <Chip label="Portada" size="small"
                          sx={{ position: 'absolute', top: 10, left: 10, height: 20, fontSize: 10, fontWeight: 800, bgcolor: ACENTO, color: INK }} />
                      )}
                      {it.file && it.progreso == null && !it.error && (
                        <Chip label="Nueva" size="small" variant="outlined"
                          sx={{ position: 'absolute', top: 10, right: 10, height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#fff' }} />
                      )}
                      {it.progreso != null && (
                        <LinearProgress variant="determinate" value={it.progreso} sx={{ mt: 0.5, borderRadius: 1 }} />
                      )}
                      {it.error && (
                        <Typography variant="caption" color="error" display="block" noWrap title={it.error} mt={0.25}>{it.error}</Typography>
                      )}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Box display="flex">
                          <IconButton size="small" onClick={() => moverItem(i, -1)} disabled={i === 0 || guardando} aria-label="Mover a la izquierda" sx={{ p: 0.5 }}>
                            <ChevronLeftIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => moverItem(i, 1)} disabled={i === galeria.length - 1 || guardando} aria-label="Mover a la derecha" sx={{ p: 0.5 }}>
                            <ChevronRightIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                        <Tooltip title="Quitar">
                          <span>
                            <IconButton size="small" color="error" onClick={() => quitarItem(it.k)} disabled={guardando} aria-label="Quitar imagen" sx={{ p: 0.5 }}>
                              <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              <input ref={inputRef} type="file" accept="image/*,.gif" multiple hidden onChange={(e) => agregarArchivos(e.target.files)} />
              <Box
                role="button" tabIndex={0}
                onClick={() => !guardando && inputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (!guardando) agregarArchivos(e.dataTransfer.files); }}
                sx={{
                  border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 2, minHeight: 56,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, cursor: guardando ? 'default' : 'pointer',
                  color: 'text.secondary', transition: 'all .15s',
                  '&:hover, &:focus-visible': { borderColor: INK, bgcolor: ACENTO_SUAVE, color: 'text.primary', outline: 'none' },
                }}
              >
                <CloudUploadIcon />
                <Typography variant="body2" fontWeight={600}>
                  {galeria.length >= MAX_IMAGENES ? `Llegaste al máximo de ${MAX_IMAGENES}` : isMobile ? 'Elegir imágenes o GIFs' : 'Arrastrá o tocá para elegir imágenes o GIFs'}
                </Typography>
              </Box>
            </Box>

            {/* Demostración: videos */}
            <Box>
              <Typography variant="subtitle2" mb={0.25}>Videos de YouTube</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.25}>
                Hasta {MAX_VIDEOS}. Sirve cualquier link: watch, youtu.be o shorts. El socio los abre desde el portal.
              </Typography>

              {videos.length > 0 && (
                <Box display="flex" flexDirection="column" gap={1} mb={1.5}>
                  {videos.map((v, i) => {
                    const id = youtubeId(v);
                    return (
                      <Paper key={`${id || v}-${i}`} variant="outlined" sx={{ p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {id ? (
                          <Box component="img" src={ytThumb(id)} alt="" loading="lazy"
                            sx={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 1, flexShrink: 0, bgcolor: INK }} />
                        ) : (
                          <Box sx={{ width: 72, height: 48, borderRadius: 1, flexShrink: 0, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <YouTubeIcon color="disabled" />
                          </Box>
                        )}
                        <Box minWidth={0} flex={1}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <YouTubeIcon color="error" sx={{ fontSize: 18 }} />
                            <Typography variant="body2" fontWeight={600} noWrap>{id ? `youtu.be/${id}` : v}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">{v}</Typography>
                        </Box>
                        <Tooltip title="Quitar">
                          <span>
                            <IconButton size="small" color="error" onClick={() => setVideos((prev) => prev.filter((_, j) => j !== i))} disabled={guardando} aria-label="Quitar video" sx={tapSx}>
                              <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Paper>
                    );
                  })}
                </Box>
              )}

              <Box display="flex" gap={1} alignItems="flex-start">
                <TextField
                  label="Link de YouTube" value={videoInput} fullWidth
                  onChange={(e) => { setVideoInput(e.target.value); setVideoError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarVideo(); } }}
                  error={Boolean(videoError)}
                  helperText={videoError || (youtubeId(videoInput) ? 'Link válido — tocá Agregar' : ' ')}
                  placeholder="https://www.youtube.com/watch?v=…"
                  disabled={guardando || videos.length >= MAX_VIDEOS}
                  InputProps={{ startAdornment: <InputAdornment position="start"><YouTubeIcon color="error" sx={{ fontSize: 20 }} /></InputAdornment> }}
                />
                <Button variant="outlined" onClick={agregarVideo} disabled={guardando || !videoInput.trim() || videos.length >= MAX_VIDEOS}
                  sx={{ flexShrink: 0, mt: '1px', minHeight: isMobile ? 44 : 40 }}>
                  Agregar
                </Button>
              </Box>
              {youtubeId(videoInput) && (
                <Box component="img" src={ytThumb(youtubeId(videoInput))} alt="Miniatura del video"
                  sx={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 1.5, mt: 0.5, border: '1px solid', borderColor: 'divider' }} />
              )}
            </Box>

            <Divider />

            {/* Descripción */}
            <TituloSeccion sub="Se muestra al socio cuando el ejercicio no tiene los pasos del catálogo.">Descripción / pasos</TituloSeccion>
            <TextField
              label="Cómo se hace" multiline minRows={3} maxRows={8} fullWidth
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value.slice(0, MAX_DESCRIPCION) }))}
              inputProps={{ maxLength: MAX_DESCRIPCION }}
              helperText={`${form.descripcion.length}/${MAX_DESCRIPCION}`}
              FormHelperTextProps={{ sx: { textAlign: 'right' } }}
              placeholder={'1. Posición inicial…\n2. Bajá controlando…\n3. Subí exhalando.'}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, alignItems: 'center' }}>
          {paso && <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>{paso}</Typography>}
          <Button onClick={cerrar} disabled={guardando} sx={tapSx}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando} sx={{ minWidth: 110, ...tapSx }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Eliminar ── */}
      <Dialog open={Boolean(borrar)} onClose={() => !borrar?.cargando && setBorrar(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlineIcon color="error" /> Eliminar ejercicio
        </DialogTitle>
        <DialogContent>
          {borrar?.error && <Alert severity="error" sx={{ mb: 2 }}>{borrar.error}</Alert>}
          {borrar?.usos == null ? (
            <Typography variant="body2">
              ¿Eliminar <strong>{borrar?.ejercicio.nombre}</strong>? Se borran también sus imágenes propias. Esta acción no se puede deshacer.
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Alert severity="warning" sx={{ fontWeight: 600 }}>
                Está en {borrar.usos} {borrar.usos === 1 ? 'rutina' : 'rutinas'}.
              </Alert>
              <Typography variant="body2">
                <strong>Desactivar</strong> lo saca de la biblioteca y de las búsquedas, pero las rutinas que lo usan siguen igual. Lo podés reactivar cuando quieras.
              </Typography>
              <Typography variant="body2">
                <strong>Eliminar igual</strong> lo borra de forma definitiva <u>y lo quita de esas {borrar.usos === 1 ? 'rutina' : `${borrar.usos} rutinas`}</u>.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setBorrar(null)} disabled={borrar?.cargando} sx={tapSx}>Cancelar</Button>
          {borrar?.usos == null ? (
            <Button variant="contained" color="error" onClick={() => confirmarBorrar(false)} disabled={borrar?.cargando} sx={{ minWidth: 110, ...tapSx }}>
              {borrar?.cargando ? <CircularProgress size={20} color="inherit" /> : 'Eliminar'}
            </Button>
          ) : (<>
            <Button variant="outlined" onClick={desactivar} disabled={borrar?.cargando} sx={tapSx}>Desactivar</Button>
            <Button variant="contained" color="error" onClick={() => confirmarBorrar(true)} disabled={borrar?.cargando} sx={{ minWidth: 130, ...tapSx }}>
              {borrar?.cargando ? <CircularProgress size={20} color="inherit" /> : 'Eliminar igual'}
            </Button>
          </>)}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
