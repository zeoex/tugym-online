// Mensajes por defecto de WhatsApp. El gym puede personalizarlos en
// Configuración → Comunicación usando {nombre} y {dias} como variables.
export const MSG_MOROSO_DEFAULT =
  '¡Hola {nombre}! Te contactamos del gimnasio para avisarte que tu membresía se encuentra vencida. Por favor, acercate a renovarla cuando puedas. ¡Te esperamos!';

export const MSG_RECUPERACION_DEFAULT =
  '¡Hola {nombre}! Hace {dias} días que no te vemos por el gym y te extrañamos 💪 ¿Todo bien? Te esperamos esta semana. ¡Abrazo!';

export function whatsappUrl(telefono, plantilla, vars = {}) {
  const num = String(telefono).replace(/\D/g, '');
  const intl = num.startsWith('54') ? num : `54${num}`;
  const texto = Object.entries(vars).reduce(
    (t, [clave, valor]) => t.replaceAll(`{${clave}}`, String(valor)),
    plantilla
  );
  return `https://wa.me/${intl}?text=${encodeURIComponent(texto)}`;
}
