import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useSolicitudesPendientes from './useSolicitudesPendientes';

/* Navegación principal arriba; el drawer lateral queda solo para mobile. */
export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  /* Contadores que se muestran como badge en el menú (ver `badge` en navItems).
     Se consultan una sola vez acá y se reparten a ambas navegaciones. */
  const solicitudesPendientes = useSolicitudesPendientes();
  const badges = { solicitudes: solicitudesPendientes };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Navbar onMenuClick={() => setMobileOpen(true)} badges={badges} />

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        variant="temporary"
        sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: 250 } }}
      >
        <Sidebar badges={badges} />
      </Drawer>

      <Box component="main" sx={{
        pt: { xs: 9.5, md: 10 },
        pb: 4,
        px: { xs: 2, md: 3.5 },
        maxWidth: 1440,
        mx: 'auto',
      }}>
        <Outlet />
      </Box>
    </Box>
  );
}
