import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

/* Navegación principal arriba; el drawer lateral queda solo para mobile. */
export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Navbar onMenuClick={() => setMobileOpen(true)} />

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        variant="temporary"
        sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: 250 } }}
      >
        <Sidebar />
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
