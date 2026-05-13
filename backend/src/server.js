require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const authRoutes      = require('./routes/auth');
const sociosRoutes    = require('./routes/socios');
const planesRoutes    = require('./routes/planes');
const pagosRoutes     = require('./routes/pagos');
const dashboardRoutes = require('./routes/dashboard');
const rutinasRoutes   = require('./routes/rutinas');
const cajaRoutes      = require('./routes/caja');
require('./jobs/vencimientosJob');

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Demasiadas solicitudes' } }));

app.use('/api/auth',      authRoutes);
app.use('/api/socios',    sociosRoutes);
app.use('/api/planes',    planesRoutes);
app.use('/api/pagos',     pagosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rutinas',   rutinasRoutes);
app.use('/api/caja',      cajaRoutes);

app.use(errorHandler);

// En producción el backend sirve el frontend compilado
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TuGymOnLine backend corriendo en http://localhost:${PORT}`));
