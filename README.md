# Organizador de eventos – Frontend

React 19 + Vite + React Router. Implementa:

- **US-01** Crear evento (`/eventos/nuevo`): formulario controlado con validación en cliente, mensajes junto a cada campo, toast de éxito y redirección al detalle.
- **US-02** Gestiones logísticas: se crean, listan, editan y eliminan de forma inline dentro de `/evento/:id` (sin rutas adicionales).
- **US-03** Editar/eliminar evento y gestiones: edición inline, modal de confirmación ("Esta acción no se puede deshacer"), reintento ante errores y estados vacíos.
- **US-04** Vista **Hoy** (`/hoy`): agrupa las gestiones de todos los eventos en *Vencidas*, *Para hoy* y *Próximas (7 días)*, con la regla de orden visible.
- **US-05** Filtros en **Hoy**: por evento y por estado de la gestión (*Vencidas*, *Para hoy*, *Próximas*). Se aplican sin reordenar (se mantiene la regla de prioridad), quedan en la URL (`/hoy?evento=3&estado=vencidas`) y se limpian con "Limpiar filtros". Si no hay resultados: "No hay gestiones para estos filtros".
- **US-11** Inicio de sesión (`/login`): todas las demás rutas exigen sesión y, sin ella, redirigen al login. Tras entrar se vuelve a la ruta pedida (por defecto `/hoy`). Las credenciales incorrectas muestran "Credenciales inválidas" sin indicar si el usuario existe. Cada organizador solo ve sus propios datos (lo garantiza el backend). `/crear` lleva a `/eventos/nuevo`.

### Sesión

- El token se guarda en `localStorage` (clave `organizador-eventos.session`) y se envía en cada petición como `Authorization: Token <token>`.
- Si el backend responde `401` (token revocado, p. ej. al cerrar sesión en otro navegador), la sesión se cierra y se vuelve al login.
- "Cerrar sesión" invalida el token en el servidor. Las cuentas las crea el administrador (no hay registro público).

### Regla de la vista Hoy

1. Grupos en este orden: **Vencidas** (plazo antes de hoy), **Para hoy** (plazo = hoy), **Próximas** (de mañana a 7 días; constante `UPCOMING_DAYS` en `src/lib/today.js`).
2. Vencidas: la más antigua primero. Próximas: la más cercana primero.
3. Empate de plazo: menor `horas_estimadas` primero.
4. Gestiones con plazo a más de 7 días no se muestran en esta vista.

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

Todas las rutas, salvo el login, exigen la cabecera `Authorization: Token <token>`.

| Método | Ruta | Cuerpo |
| --- | --- | --- |
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
| DELETE | `/subtareas/:id/` | – |

- `tipo`: `boda | social | corporativo | cumpleanos | otro`
- `fecha` / `plazo`: `YYYY-MM-DD`; `hora`: `HH:mm`; `horas_estimadas`: número > 0.
- Reglas: la fecha y hora del evento deben ser futuras y el plazo de una gestión no puede ser anterior a hoy (el backend también debe validarlas).
- Errores de validación (400): `{ campo: ["mensaje"] }` (formato DRF), `{ errors: { campo: "mensaje" } }` o `{ errors: [{ field, message }] }`.
