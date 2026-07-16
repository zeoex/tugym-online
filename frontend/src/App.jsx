import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box, ThemeProvider, CssBaseline } from '@mui/material';
import { adminTheme, portalTheme } from './theme';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ListaSocios from './pages/Socios/ListaSocios';
import FormSocio from './pages/Socios/FormSocio';
import DetalleSocio from './pages/Socios/DetalleSocio';
import GestionPagos from './pages/Pagos/GestionPagos';
import Vencimientos from './pages/Vencimientos/Vencimientos';
import GestionPlanes from './pages/Planes/GestionPlanes';
import Rutinas from './pages/Rutinas/Rutinas';
import Caja from './pages/Caja/Caja';
import GestionAnuncios from './pages/Anuncios/GestionAnuncios';
import Asistencias from './pages/Asistencias/Asistencias';
import Configuracion from './pages/Configuracion/Configuracion';
import PortalLayout from './pages/Portal/PortalLayout';
import PortalHome from './pages/Portal/PortalHome';
import PortalRutina from './pages/Portal/PortalRutina';
import PortalCarnet from './pages/Portal/PortalCarnet';

function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  return usuario ? children : <Navigate to="/login" replace />;
}

/* Cada mundo monta su propio tema: el socio vive en modo noche,
   el admin trabaja en claro. Solo uno está montado a la vez. */
function AdminShell() {
  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Outlet />
    </ThemeProvider>
  );
}

function PortalShell() {
  return (
    <ThemeProvider theme={portalTheme}>
      <CssBaseline />
      <Outlet />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PortalShell />}>
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalHome />} />
          <Route path="rutina" element={<PortalRutina />} />
          <Route path="carnet" element={<PortalCarnet />} />
        </Route>
      </Route>

      <Route element={<AdminShell />}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"          element={<Dashboard />} />
          <Route path="socios"             element={<ListaSocios />} />
          <Route path="socios/nuevo"       element={<FormSocio />} />
          <Route path="socios/:id/detalle" element={<DetalleSocio />} />
          <Route path="socios/:id"         element={<FormSocio />} />
          <Route path="planes"             element={<GestionPlanes />} />
          <Route path="pagos"              element={<GestionPagos />} />
          <Route path="vencimientos"       element={<Vencimientos />} />
          <Route path="asistencias"        element={<Asistencias />} />
          <Route path="rutinas"            element={<Rutinas />} />
          <Route path="caja"               element={<Caja />} />
          <Route path="anuncios"           element={<GestionAnuncios />} />
          <Route path="configuracion"      element={<Configuracion />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
