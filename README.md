# Organizador de eventos – Frontend

React 19 + Vite + React Router. Implementa:

- **US-01** Crear evento (`/eventos/nuevo`): formulario controlado con validación en cliente, mensajes junto a cada campo, toast de éxito y redirección al detalle.
- **US-02** Gestiones logísticas: se crean, listan, editan y eliminan de forma inline dentro de `/evento/:id` (sin rutas adicionales).
- **US-03** Editar/eliminar evento y gestiones: edición inline, modal de confirmación ("Esta acción no se puede deshacer"), reintento ante errores y estados vacíos.

## Ejecutar

```bash
npm install
npm run dev
```

### Conectar con el backend

Crea `.env.local` a partir de `.env.example`:

```
VITE_API_URL=http://localhost:3000/api
```

Si `VITE_API_URL` no está definida, la app funciona en **modo demo** con datos guardados en `localStorage` (se indica en la barra superior).

## Contrato de API esperado

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| GET | `/events` | – |
| POST | `/events` | `{ name, type, client, date, location }` |
| GET | `/events/:id` | – |
| PATCH | `/events/:id` | campos a modificar |
| DELETE | `/events/:id` | – (borra en cascada sus gestiones) |
| GET | `/events/:id/subtasks` | – |
| POST | `/events/:id/subtasks` | `{ name, deadline, estimatedHours }` |
| PATCH | `/events/:id/subtasks/:subtaskId` | campos a modificar |
| DELETE | `/events/:id/subtasks/:subtaskId` | – |

- `type`: `boda | social | corporativo | cumpleanos | otro`
- `date`: ISO 8601 (fecha y hora); `deadline`: `YYYY-MM-DD`; `estimatedHours`: número > 0.
- Respuestas: el recurso directo o envuelto como `{ data, message }`.
- Errores de validación (400): `{ message, errors: { campo: "mensaje" } }` o `{ message, errors: [{ field, message }] }`; se muestran junto al campo correspondiente.
