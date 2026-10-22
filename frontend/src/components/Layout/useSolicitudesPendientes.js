import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';

/* Evento que dispara la pantalla de Solicitudes al aprobar/rechazar,
   para que el badge del menú se actualice sin esperar al próximo poll. */
export const EVENTO_SOLICITUDES = 'solicitudes:cambio';
export const avisarCambioSolicitudes = () => window.dispatchEvent(new Event(EVENTO_SOLICITUDES));

const INTERVALO_MS = 60_000;

/* Total de solicitudes de alta pendientes: se consulta al montar, cada 60 s
   y cuando la pantalla de Solicitudes avisa que cambió algo. Un fallo de red
   no rompe el layout: deja el último valor conocido. */
export default function useSolicitudesPendientes() {
  const [total, setTotal] = useState(0);

  const refrescar = useCallback(async () => {
    try {
      const { data } = await api.get('/solicitudes/pendientes/count');
      setTotal(Number(data?.total) || 0);
    } catch {
      /* silencioso: el badge es informativo */
    }
  }, []);

  useEffect(() => {
    refrescar();
    const timer = setInterval(refrescar, INTERVALO_MS);
    window.addEventListener(EVENTO_SOLICITUDES, refrescar);
    return () => {
      clearInterval(timer);
      window.removeEventListener(EVENTO_SOLICITUDES, refrescar);
    };
  }, [refrescar]);

  return total;
}
