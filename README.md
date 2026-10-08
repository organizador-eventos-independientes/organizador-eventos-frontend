# Organizador de eventos – Frontend

React 19 + Vite + React Router. Implementa:

- **US-01** Crear evento (`/eventos/nuevo`): formulario controlado con validación en cliente, mensajes junto a cada campo, toast de éxito y redirección al detalle.
- **US-02** Gestiones logísticas: se crean, listan, editan y eliminan de forma inline dentro de `/evento/:id` (sin rutas adicionales).
- **US-03** Editar/eliminar evento y gestiones: edición inline, modal de confirmación ("Esta acción no se puede deshacer"), reintento ante errores y estados vacíos.
- **US-04** Vista **Hoy** (`/hoy`): agrupa los eventos y sus gestiones en *Gestiones vencidas*, *Para hoy* y *Próximas*, con la regla de orden visible (se oculta mientras no haya eventos).
- **US-05** Filtros en **Hoy**: por evento y por estado (*Vencidas*, *Para hoy*, *Próximas*). Se aplican sin reordenar (se mantiene la regla de prioridad), quedan en la URL (`/hoy?evento=3&estado=vencidas`) y se limpian con "Limpiar filtros". Si no hay resultados: "No hay gestiones para estos filtros".
- **US-06** Reprogramar gestión en **Hoy**: cada gestión tiene el botón "Reprogramar", que abre en la misma fila el campo "Nueva fecha objetivo" (no puede ser anterior a hoy, aunque la gestión esté vencida). Al guardar se muestra "Fecha actualizada." y la gestión pasa al grupo que le corresponde, resaltada un momento. Si falla, se muestra "No se pudo reprogramar" y se mantiene la fecha seleccionada para reintentar. Esc cancela.
- **US-07** Conflicto por sobrecarga diaria al reprogramar: si con la gestión ese día pasa del límite diario (sumando las gestiones de todos los eventos; un día vacío empieza en 0 h), no se guarda y aparece el aviso "Quedarías con 7h de gestión planificadas (límite 6h)" con lo que ya hay ese día y tres opciones: *Mover a otro día* (vuelve al calendario), *Reducir horas estimadas* (la deja en lo que cabe) y *Posponer* (al primer día con espacio). Si cabe, se guarda directo. Llegar justo al límite está permitido.
- **US-12** Límite diario de horas de gestión en **Configuración** (`/configuracion`, desde el menú del usuario): muestra "Tu límite actual" (6 h "valor por defecto" si nunca se guardó) y permite cambiarlo. Debe estar entre 1 y 16 h; fuera de ese rango no se guarda y se muestra "El límite debe estar entre 1 y 16 horas.". Al guardar: "Límite actualizado." Cada organizador tiene el suyo y US-07 usa siempre el actual. El botón "Límite diario" de la barra de **Hoy** lo muestra y es un atajo para cambiarlo.
- **US-11** Inicio de sesión (`/login`): todas las demás rutas exigen sesión y, sin ella, redirigen al login. Tras entrar se vuelve a la ruta pedida (por defecto `/hoy`). Las credenciales incorrectas muestran "Credenciales inválidas" sin indicar si el usuario existe. Cada organizador solo ve sus propios datos (lo garantiza el backend). `/crear` lleva a `/eventos/nuevo`. Desde el login se puede crear una cuenta en `/registro` (nombre, usuario y contraseña); al registrarse se entra directamente.

### Sesión

- El token se guarda en `localStorage` (clave `organizador-eventos.session`) y se envía en cada petición como `Authorization: Token <token>`.
- Si el backend responde `401` (token revocado, p. ej. al cerrar sesión en otro navegador), la sesión se cierra y se vuelve al login.
- "Cerrar sesión" invalida el token en el servidor. Cualquier persona puede crear su cuenta en `/registro`; los datos se guardan en el backend.

### Regla de la vista Hoy

1. Grupos en este orden: **Vencidas** (fecha antes de hoy), **Para hoy** (fecha = hoy) y **Próximas** (fecha posterior a hoy). Cada evento entra por su fecha y cada gestión por su plazo.
2. Vencidas: la más antigua primero. Próximas: la más cercana primero.
3. Empate de fecha: primero el evento y luego las gestiones con menos `horas_estimadas`.

## Ejecutar

Requiere el backend (Django) en ejecución, con autenticación (US-11) y al menos una cuenta creada.

```bash
npm install
npm run dev
```

### URL del backend

Por defecto la app usa `http://localhost:8000/api`. Para cambiarla, crea `.env.local` a partir de `.env.example`:

```
VITE_API_URL=http://localhost:8000/api
```

## Contrato de API (Django)

Todas las rutas, salvo el registro y el login, exigen la cabecera `Authorization: Token <token>`.

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| POST | `/auth/registro/` | `{ nombre, username, password }` → 201 `{ token, usuario }`; 400 `{ campo: ["mensaje"] }` si algo no es válido |
| POST | `/auth/login/` | `{ username, password }` → `{ token, usuario: { id, username, nombre } }`; 400 si las credenciales son incorrectas |
| POST | `/auth/logout/` | – (invalida el token) |
| GET | `/eventos/` | – |
| POST | `/eventos/` | `{ titulo, tipo, cliente, fecha, hora, lugar }` |
| GET | `/eventos/:id/` | – |
| PATCH | `/eventos/:id/` | `{ titulo, tipo, cliente, fecha, hora, lugar }` |
| DELETE | `/eventos/:id/` | – (borra en cascada sus gestiones) |
| GET | `/eventos/:id/subtareas/` | – |
| POST | `/eventos/:id/subtareas/` | `{ nombre, plazo, horas_estimadas }` |
| PATCH | `/subtareas/:id/` | `{ nombre, plazo, horas_estimadas }` |
| PATCH | `/subtareas/:id/reprogramar/` | `{ plazo, horas_estimadas? }` → la gestión con su nueva fecha; 400 `{ detail: "No se pudo reprogramar.", plazo: ["motivo"] }`; 409 `{ detail: "Quedarías con…", conflicto: {…} }` si ese día pasa del límite diario |
| GET | `/configuracion/` | – → `{ limite_horas_diarias, por_defecto }` |
| PATCH | `/configuracion/` | `{ limite_horas_diarias }` (entre 1 y 16) → 400 `{ limite_horas_diarias: ["El límite debe estar entre 1 y 16 horas."] }` si no |
| DELETE | `/subtareas/:id/` | – |

- `tipo`: `boda | social | corporativo | cumpleanos | otro`
- `fecha` / `plazo`: `YYYY-MM-DD`; `hora`: `HH:mm`; `horas_estimadas`: número > 0.
- Reglas: la fecha y hora del evento deben ser futuras y el plazo de una gestión no puede ser anterior a hoy (el backend también debe validarlas).
- Errores de validación (400): `{ campo: ["mensaje"] }` (formato DRF), `{ errors: { campo: "mensaje" } }` o `{ errors: [{ field, message }] }`.
