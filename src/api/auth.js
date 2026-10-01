import { request } from './client'

// Respuesta del backend { token, usuario } -> sesión { token, user }.
function toSession(data) {
  return {
    token: data.token,
    user: {
      id: data.usuario.id,
      username: data.usuario.username,
      name: data.usuario.nombre,
    },
  }
}

// Devuelve la sesión { token, user } si las credenciales son correctas (US-11).
export async function login(username, password) {
  const data = await request('/auth/login/', {
    method: 'POST',
    body: { username, password },
  })
  return toSession(data)
}

// Crea la cuenta y devuelve su sesión ya iniciada. Si los datos no son válidos
// lanza un ApiError con fieldErrors { name, username, password }.
export async function register({ name, username, password }) {
  const data = await request('/auth/registro/', {
    method: 'POST',
    body: { nombre: name, username, password },
  })
  return toSession(data)
}

// Invalida en el servidor el token de la sesión actual (se lee al llamar).
export const logout = () => request('/auth/logout/', { method: 'POST' })
