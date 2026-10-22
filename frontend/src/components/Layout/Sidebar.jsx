import { List, ListItemButton, ListItemIcon, ListItemText, Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ACENTO, ACENTO_SUAVE, ACERO, INK, FUENTE_MARCA } from '../../theme';
import { NAV_GROUPS } from './navItems';

const DEFAULT_CLR = 'rgba(244,244,242,0.45)';

export default function Sidebar({ badges = {} }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: INK }}>
      {/* Marca */}
      <Box sx={{ px: 3, pt: 3.5, pb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2.5, flexShrink: 0,
          bgcolor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Box component="img" src="/marca/toro.png" alt="Torino Fitness" sx={{ height: 26, width: 'auto', display: 'block' }} />
        </Box>
        <Box>
          <Typography
            lineHeight={1.2}
            sx={{ fontFamily: FUENTE_MARCA, fontWeight: 700, fontSize: 15, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Torino Fitness
          </Typography>
          <Typography variant="caption" sx={{ color: ACERO, lineHeight: 1, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
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
                  color: 'rgba(244,244,242,0.25)',
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
              {group.items.map(({ label, icon, path, badge }) => {
                const active = pathname === path || pathname.startsWith(path + '/');
                const contador = badge ? badges[badge] || 0 : 0;
                return (
                  <ListItemButton
                    key={path}
                    onClick={() => navigate(path)}
                    sx={{
                      borderRadius: 2.5, mb: 0.5, px: 1.5,
                      bgcolor: active ? ACENTO_SUAVE : 'transparent',
                      '&:hover': { bgcolor: active ? ACENTO_SUAVE : 'rgba(255,255,255,0.08)' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <ListItemIcon sx={{ color: active ? ACENTO : DEFAULT_CLR, minWidth: 36 }}>
                      {icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: active ? 700 : 400,
                        color: active ? ACENTO : DEFAULT_CLR,
                      }}
                    />
                    {contador > 0 && (
                      <Box
                        component="span"
                        sx={{
                          minWidth: 20, height: 20, px: 0.75, ml: 1,
                          borderRadius: 10,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, lineHeight: 1,
                          bgcolor: ACENTO, color: INK, flexShrink: 0,
                        }}
                      >
                        {contador > 99 ? '99+' : contador}
                      </Box>
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Pie */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid rgba(244,244,242,0.06)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(244,244,242,0.25)', fontSize: 10 }}>v2.0.0</Typography>
        <Typography variant="caption" display="block" sx={{ color: 'rgba(244,244,242,0.18)', fontSize: 9, mt: 0.25 }}>
          &copy; ZeoDev 2026
        </Typography>
      </Box>
    </Box>
  );
}
