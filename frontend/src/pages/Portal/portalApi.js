import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export const portalApi = axios.create({ baseURL: `${BASE}/portal` });

// ── Sesión del socio (JWT de 30 días, rol SOCIO) ──
export const sesionSocio = {
  get: () => localStorage.getItem('portal_token') || '',
  nombre: () => localStorage.getItem('portal_nombre') || '',
  set: (token, nombre) => {
    localStorage.setItem('portal_token', token);
    localStorage.setItem('portal_nombre', nombre || '');
  },
  clear: () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_nombre');
  },
  activa: () => Boolean(localStorage.getItem('portal_token')),
};

portalApi.interceptors.request.use((config) => {
  const token = sesionSocio.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sesión vencida → limpiar y que la UI vuelva a pedir login
portalApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) sesionSocio.clear();
    return Promise.reject(err);
  }
);

// El DNI queda recordado para precargar el login.
export const dniGuardado = {
  get: () => localStorage.getItem('portal_dni') || '',
  set: (v) => localStorage.setItem('portal_dni', String(v).trim()),
  clear: () => localStorage.removeItem('portal_dni'),
};

// Identificador estable de este teléfono: el servidor lo usa para que un
// mismo dispositivo no registre check-ins en cadena para varios socios.
export function deviceId() {
  let id = localStorage.getItem('portal_device');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('portal_device', id);
  }
  return id;
}
