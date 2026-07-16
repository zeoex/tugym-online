const path = require('path');
const fs = require('fs');

// En Railway el filesystem del contenedor es efímero: UPLOADS_DIR apunta al volumen montado.
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

module.exports = uploadsDir;
