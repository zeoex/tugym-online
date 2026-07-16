import { List, ListItemButton, ListItemIcon, ListItemText, Box, Typography } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useNavigate, useLocation } from 'react-router-dom';
import { LIMA, INK } from '../../theme';
import { NAV_GROUPS } from './navItems';

const DEFAULT_CLR = 'rgba(242,245,234,0.45)';

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: INK }}>
      {/* Marca */}
      <Box sx={{ px: 3, pt: 3.5, pb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: 2.5,
          bgcolor: LIMA,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 18px rgba(200,241,63,0.3)',
        }}>
          <FitnessCenterIcon sx={{ color: INK, fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.2} letterSpacing="-0.3px"
            fontFamily="'Barlow Condensed', sans-serif">
            TuGymOnLine
          </Typography>
          <Typography variant="caption" sx={{ color: LIMA, lineHeight: 1, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
            ADMIN
          </Typography>
        </Box>
      </Box>

      {/* Navegación */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pt: 0.5 }}>
        {NAV_GROUPS.map((group, gi) => (
          <Box key={gi} mb={0.5}>
            {group.label && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(242,245,234,0.25)',
                  px: 1.5, pt: gi === 0 ? 1 : 2, pb: 0.75,
                  display: 'block',
                  letterSpacing: '1.4px',
                  textTransform: 'uppercase',
                  fontSize: 10,
                  fontWeight: 700,
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
                      borderRadius: 2.5, mb: 0.5, px: 1.5,
                      bgcolor: active ? 'rgba(200,241,63,0.1)' : 'transparent',
                      '&:hover': { bgcolor: active ? 'rgba(200,241,63,0.12)' : 'rgba(242,245,234,0.04)' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <ListItemIcon sx={{ color: active ? LIMA : DEFAULT_CLR, minWidth: 36 }}>
                      {icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: active ? 700 : 400,
                        color: active ? LIMA : DEFAULT_CLR,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Pie */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid rgba(242,245,234,0.06)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(242,245,234,0.25)', fontSize: 10 }}>v2.0.0</Typography>
        <Typography variant="caption" display="block" sx={{ color: 'rgba(242,245,234,0.18)', fontSize: 9, mt: 0.25 }}>
          &copy; ZeoDev 2026
        </Typography>
      </Box>
    </Box>
  );
}
