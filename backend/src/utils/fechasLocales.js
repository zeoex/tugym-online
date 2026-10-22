// Helpers de fecha en hora LOCAL del proceso (el contenedor corre en
// America/Argentina/Buenos_Aires). Nunca usar toISOString().slice(0,10) para
// agrupar por día: eso es UTC y corre un pago de las 23:30 al día siguiente.

const pad2 = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' -> Date a las 00:00 local. null si el formato o la fecha no valen.
function parsearFechaLocal(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  // new Date(2026, 1, 31) "desborda" a marzo: lo rechazamos.
  if (fecha.getFullYear() !== y || fecha.getMonth() !== m - 1 || fecha.getDate() !== d) return null;
  return fecha;
}

// Date -> 'YYYY-MM-DD' con la fecha local (la del proceso), no UTC.
function claveDia(fecha) {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}-${pad2(fecha.getDate())}`;
}

// Date -> 'YYYY-MM'
function claveMes(fecha) {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}`;
}

// Date -> 'YYYY-MM-DD HH:mm' local, para exportar.
function formatoLocal(fecha) {
  return `${claveDia(fecha)} ${pad2(fecha.getHours())}:${pad2(fecha.getMinutes())}`;
}

function inicioDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

// Rango inclusivo de días -> { inicio: 00:00 del desde, fin: 00:00 del día
// siguiente a hasta (exclusivo, para usar con gte/lt), dias }.
function rangoLocal(desde, hasta) {
  const inicio = inicioDia(desde);
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate() + 1);
  return { inicio, fin, dias: diasEntre(inicio, fin) };
}

// Cantidad de días civiles entre dos medianoches locales (robusto a DST).
function diasEntre(inicio, fin) {
  return Math.round((inicioDia(fin) - inicioDia(inicio)) / 86400000);
}

// Lista de claves 'YYYY-MM-DD' de cada día en [inicio, fin).
function listarDias(inicio, fin) {
  const dias = [];
  for (let d = inicioDia(inicio); d < fin; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    dias.push(claveDia(d));
  }
  return dias;
}

// Lista de claves 'YYYY-MM' de cada mes tocado por [inicio, fin).
function listarMeses(inicio, fin) {
  const meses = [];
  const ultimo = new Date(fin.getTime() - 1);
  for (let d = new Date(inicio.getFullYear(), inicio.getMonth(), 1); d <= ultimo; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    meses.push(claveMes(d));
  }
  return meses;
}

module.exports = {
  parsearFechaLocal,
  claveDia,
  claveMes,
  formatoLocal,
  inicioDia,
  rangoLocal,
  diasEntre,
  listarDias,
  listarMeses,
};
