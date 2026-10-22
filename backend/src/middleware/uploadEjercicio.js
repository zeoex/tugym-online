const fs = require('fs');
const path = require('path');
const multer = require('multer');
const uploadsDir = require('../config/uploads');

// Imágenes/GIFs propios de un ejercicio: <uploadsDir>/ejercicios/ej_<id>_<ts>_<n><ext>
const ejerciciosDir = path.join(uploadsDir, 'ejercicios');
fs.mkdirSync(ejerciciosDir, { recursive: true });

const PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_POR_SUBIDA = 10;
const MENSAJE_RECHAZO = 'Subí una imagen JPG, PNG, WEBP o GIF de hasta 8 MB';

const storage = multer.diskStorage({
  destination: ejerciciosDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    req._ejSeq = (req._ejSeq || 0) + 1;
    cb(null, `ej_${parseInt(req.params.id, 10)}_${Date.now()}_${req._ejSeq}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!PERMITIDAS.includes(ext)) {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    err.message = MENSAJE_RECHAZO;
    return cb(err);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES, files: MAX_POR_SUBIDA } });

// Borra lo que multer ya había guardado antes de fallar (p. ej. el 3er archivo
// era .exe): no dejamos huérfanos en el volumen.
function limpiarSubidos(req) {
  for (const f of req.files || []) fs.promises.unlink(f.path).catch(() => {});
}

// Envuelve upload.array('imagenes') para que cualquier rechazo de multer
// (tipo, tamaño, cantidad) sea un 400 con mensaje claro en vez de un 500 genérico.
function subirImagenes(req, res, next) {
  upload.array('imagenes', MAX_POR_SUBIDA)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      limpiarSubidos(req);
      return res.status(400).json({ error: MENSAJE_RECHAZO });
    }
    if (err) { limpiarSubidos(req); return next(err); }
    next();
  });
}

module.exports = { subirImagenes, ejerciciosDir, MENSAJE_RECHAZO, MAX_POR_SUBIDA };
