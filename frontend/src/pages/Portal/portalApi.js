import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export const portalApi = axios.create({ baseURL: `${BASE}/portal` });

// El DNI queda recordado en el teléfono: se carga una sola vez.
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
