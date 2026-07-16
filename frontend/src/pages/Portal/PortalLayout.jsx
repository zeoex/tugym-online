import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BadgeIcon from '@mui/icons-material/Badge';
import { ACENTO, INK } from '../../theme';
import { portalApi } from './portalApi';

const TABS = [
  { valor: '/portal',        label: 'Inicio', icon: <BoltIcon /> },
  { valor: '/portal/rutina', label: 'Rutina', icon: <FitnessCenterIcon /> },
  { valor: '/portal/carnet', label: 'Carnet', icon: <BadgeIcon /> },
];

export default function PortalLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [info, setInfo] = useState(null);

  const refrescarInfo = useCallback(() => {
    portalApi.get('/info').then((r) => setInfo(r.data)).catch(() => {});
  }, []);

  useEffect(() => { refrescarInfo(); }, [refrescarInfo]);

  const tabActiva = TABS.reduce(
    (mejor, t) => (pathname === t.valor || (t.valor !== '/portal' && pathname.startsWith(t.valor)) ? t.valor : mejor),
    '/portal'
  );

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.75,
        display: 'flex', alignItems: 'center', gap: 1.5,
        position: 'sticky', top: 0, zIndex: 20,
        bgcolor: 'rgba(7,11,20,0.85)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(237,241,249,0.07)',
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2.5,
          bgcolor: ACENTO,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 18px rgba(78,159,255,0.35)',
          flexShrink: 0,
        }}>
          <FitnessCenterIcon sx={{ color: INK, fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontSize={16} lineHeight={1.15} noWrap>
            {info?.nombreGym || 'TuGymOnLine'}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontSize={10.5} lineHeight={1}>
            Tu entrenamiento, en tu bolsillo
          </Typography>
        </Box>
      </Box>

      {/* Contenido */}
      <Box sx={{ flexGrow: 1, width: '100%', maxWidth: 640, mx: 'auto', px: 2, pt: 2.5, pb: 13 }}>
        <Outlet context={{ info, refrescarInfo }} />
      </Box>

      {/* Footer */}
      <Typography variant="caption" sx={{ textAlign: 'center', color: 'rgba(237,241,249,0.18)', fontSize: 10, pb: 10 }}>
        &copy; ZeoDev 2026
      </Typography>

      {/* Navegación inferior estilo app */}
      <Paper sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        borderRadius: 0, border: 'none',
        borderTop: '1px solid rgba(237,241,249,0.08)',
        pb: 'env(safe-area-inset-bottom)',
      }} elevation={0}>
        <BottomNavigation
          value={tabActiva}
          onChange={(_e, valor) => navigate(valor)}
          showLabels
          sx={{ height: 62 }}
        >
          {TABS.map((t) => (
            <BottomNavigationAction
              key={t.valor}
              value={t.valor}
              label={t.label}
              icon={t.icon}
              sx={{
                '& .MuiBottomNavigationAction-label': { fontSize: 11, fontWeight: 600 },
                '&.Mui-selected svg': { filter: 'drop-shadow(0 0 8px rgba(78,159,255,0.55))' },
                transition: 'transform 0.12s',
                '&:active': { transform: 'scale(0.94)' },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
