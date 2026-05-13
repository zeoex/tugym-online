import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
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

function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
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
        <Route path="rutinas"            element={<Rutinas />} />
        <Route path="caja"               element={<Caja />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
