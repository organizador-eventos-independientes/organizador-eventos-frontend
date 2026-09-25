# Organizador de eventos – Frontend

React 19 + Vite + React Router. Implementa:

- **US-01** Crear evento (`/eventos/nuevo`): formulario controlado con validación en cliente, mensajes junto a cada campo, toast de éxito y redirección al detalle.
- **US-02** Gestiones logísticas: se crean, listan, editan y eliminan de forma inline dentro de `/evento/:id` (sin rutas adicionales).
- **US-03** Editar/eliminar evento y gestiones: edición inline, modal de confirmación ("Esta acción no se puede deshacer"), reintento ante errores y estados vacíos.

## Ejecutar

Requiere el backend (Django) en ejecución.

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

| Método | Ruta | Cuerpo |
| --- | --- | --- |
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
