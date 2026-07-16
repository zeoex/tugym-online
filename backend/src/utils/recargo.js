// Regla de recargo por pago fuera de término.
// Aplica pagando después del día `diaPagoHasta` del mes (ej: ventana 1 al 10,
// desde el 11 hay recargo). Antes de la ventana cuenta como pago adelantado.
// Los pases diarios nunca llevan recargo.
function calcularRecargo(plan, config, fecha = new Date()) {
  if (!config.recargoActivo || plan.tipo === 'DIARIO') return { aplica: false, monto: 0 };
  if (fecha.getDate() <= config.diaPagoHasta) return { aplica: false, monto: 0 };

  const monto = Math.round(
    config.recargoTipo === 'FIJO'
      ? config.recargoValor
      : (plan.precio * config.recargoValor) / 100
  );
  return { aplica: monto > 0, monto };
}

module.exports = { calcularRecargo };
