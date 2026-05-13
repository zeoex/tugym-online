# Diseño: Filtros de socios + Página de detalle con pagos

**Fecha:** 2026-04-28  
**Estado:** Aprobado

---

## Resumen

Dos mejoras relacionadas a la gestión de socios:

1. Filtros adicionales en la lista de socios (`ListaSocios`)
2. Nueva página de detalle del socio (`DetalleSocio`) con estado general, historial de pagos y registro de pago

---

## 1. Filtros en ListaSocios

### Frontend — `frontend/src/pages/Socios/ListaSocios.jsx`

Se agregan 3 filtros nuevos a la barra existente junto a la búsqueda de texto y el filtro de estado:

| Filtro | Componente | Query param |
|---|---|---|
| Plan | `Select` cargado desde `GET /planes?soloActivos=true` | `planId` |
| Vence próximo | `Checkbox` "Vence en 7 días" | `venceProximo=true` |
| Fecha de alta desde | `TextField` tipo `date` | `fechaAltaDesde` |
| Fecha de alta hasta | `TextField` tipo `date` | `fechaAltaHasta` |

En la tabla se agrega un **botón ojo** (`VisibilityIcon`) a la derecha del lápiz de edición. Al hacer clic navega a `/socios/:id/detalle`.

### Backend — `backend/src/controllers/sociosController.js` → `listar`

Se extiende el handler para aceptar los nuevos query params:

- `planId` — filtra socios que tengan al menos un pago con ese `planId` y estado `ACTIVO`
- `venceProximo=true` — filtra socios cuyo pago activo vence entre hoy y los próximos 7 días (inclusive ambos extremos)
- `fechaAltaDesde` / `fechaAltaHasta` — filtra por rango de `fechaAlta`

---

## 2. Página DetalleSocio

### Ruta

`/socios/:id/detalle` → componente `frontend/src/pages/Socios/DetalleSocio.jsx`

Se registra en `frontend/src/App.jsx`.

### Estructura de la página

**Cabecera**
- Avatar del socio
- Nombre completo y email
- Chip de estado (ACTIVO / VENCIDO / INACTIVO)
- Botón "Editar" → navega a `/socios/:id`
- Botón "Volver" → navega a `/socios`

**Tarjetas de resumen (fila de 2 cards)**

_Card izquierda — Datos del socio:_
- DNI, Teléfono, Email
- Fecha de alta
- Plan activo (nombre del plan)
- Fecha de vencimiento

_Card derecha — Estadísticas:_
- Total pagado (suma de montos de todos los pagos)
- Cantidad de pagos registrados
- Meses como socio (desde `fechaAlta` hasta hoy)

**Tabla de historial de pagos**

Columnas: Plan, Monto, Fecha pago, Vencimiento, Método, Estado (chip)  
Ordenada por `fechaPago` desc.  
Botón "Registrar pago" encima de la tabla que abre un Dialog implementado inline en `DetalleSocio`, con la misma estructura de `GestionPagos` (select de plan, método de pago, observaciones) pero con el socio fijo (no editable, pre-cargado desde la URL). Llama a `POST /pagos` con `socioId` del socio actual. Tras confirmar el pago, recarga los datos del socio vía `GET /socios/:id`.

### Fuente de datos

`GET /socios/:id` — ya retorna el socio con todos sus pagos e info del plan. No requiere cambios en el backend.

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `frontend/src/pages/Socios/ListaSocios.jsx` | Nuevos filtros + botón ojo |
| `frontend/src/pages/Socios/DetalleSocio.jsx` | Archivo nuevo |
| `frontend/src/App.jsx` | Nueva ruta `/socios/:id/detalle` |
| `backend/src/controllers/sociosController.js` | Extender `listar` con nuevos filtros |

---

## Fuera de alcance

- Edición de datos del socio desde la página de detalle (eso queda en `FormSocio`)
- Cancelar o modificar pagos existentes
- Paginación del historial de pagos (asumimos que el historial es manejable sin paginar)
