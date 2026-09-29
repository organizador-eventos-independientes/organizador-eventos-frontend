import { request } from './client'

// Devuelve la sesión { token, user } si las credenciales son correctas (US-11).
export async function login(username, password) {
  const data = await request('/auth/login/', {
    method: 'POST',
    body: { username, password },
  })
  return {
    token: data.token,
    user: {
      id: data.usuario.id,
      username: data.usuario.username,
      name: data.usuario.nombre,
    },
  }
}

// Invalida en el servidor el token de la sesión actual (se lee al llamar).
export const logout = () => request('/auth/logout/', { method: 'POST' })
