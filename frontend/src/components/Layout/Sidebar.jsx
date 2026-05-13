import { List, ListItemButton, ListItemIcon, ListItemText, Box, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import StyleIcon from '@mui/icons-material/Style';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import { useNavigate, useLocation } from 'react-router-dom';

const SIDEBAR_BG  = '#0f172a';
const ACCENT      = '#06b6d4';
const ACTIVE_BG   = 'rgba(6,182,212,0.1)';
const DEFAULT_CLR = 'rgba(255,255,255,0.45)';
const HOVER_BG    = 'rgba(255,255,255,0.04)';

const GROUPS = [
  {
    items: [
      { label: 'Dashboard',    icon: <DashboardIcon />,     path: '/dashboard'    },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Socios',       icon: <PeopleIcon />,        path: '/socios'       },
      { label: 'Planes',       icon: <StyleIcon />,         path: '/planes'       },
      { label: 'Pagos',        icon: <PaymentIcon />,       path: '/pagos'        },
      { label: 'Vencimientos', icon: <WarningAmberIcon />,  path: '/vencimientos' },
    ],
  },
  {
    label: 'Operación',
    items: [
      { label: 'Rutinas',      icon: <DirectionsRunIcon />, path: '/rutinas'      },
      { label: 'Caja',         icon: <PointOfSaleIcon />,   path: '/caja'         },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: SIDEBAR_BG }}>
      {/* Logo */}
      <Box sx={{ px: 3, pt: 3.5, pb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: 2,
          background: `linear-gradient(135deg, ${ACCENT} 0%, #0ea5e9 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px rgba(6,182,212,0.35)`,
        }}>
          <FitnessCenterIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.2} letterSpacing="-0.3px">
            TuGymOnLine
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1, fontSize: 10 }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pt: 0.5 }}>
        {GROUPS.map((group, gi) => (
          <Box key={gi} mb={0.5}>
            {group.label && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.22)',
                  px: 1.5, pt: gi === 0 ? 1 : 2, pb: 0.75,
                  display: 'block',
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {group.label}
              </Typography>
            )}
            <List disablePadding>
              {group.items.map(({ label, icon, path }) => {
                const active = pathname === path || pathname.startsWith(path + '/');
                return (
                  <ListItemButton
                    key={path}
                    onClick={() => navigate(path)}
                    sx={{
                      borderRadius: 2, mb: 0.5, px: 1.5,
                      bgcolor: active ? ACTIVE_BG : 'transparent',
                      borderLeft: `3px solid ${active ? ACCENT : 'transparent'}`,
                      '&:hover': { bgcolor: active ? ACTIVE_BG : HOVER_BG },
                      transition: 'all 0.15s',
                    }}
                  >
                    <ListItemIcon sx={{ color: active ? ACCENT : DEFAULT_CLR, minWidth: 36 }}>
                      {icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: active ? 600 : 400,
                        color: active ? '#fff' : DEFAULT_CLR,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>v1.0.0</Typography>
      </Box>
    </Box>
  );
}
