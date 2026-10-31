// ============================================================
// 🧪 Pruebas unitarias: composables/useAuth.js
// Verifica manejo del estado de sesión, roles y restauración de token
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '@/composables/useAuth.js'
import { authApi } from '@/services/authApi.js'
import { tokenStorage } from '@/services/http.js'

describe('Composable: composables/useAuth.js', () => {
    let auth

    beforeEach(() => {
        auth = useAuth()
        auth.clearSession()
        vi.restoreAllMocks()
    })

    it('inicia con sesión vacía cuando no hay token', () => {
        expect(auth.isAuthenticated.value).toBe(false)
        expect(auth.isAdmin.value).toBe(false)
        expect(auth.state.user).toBeNull()
    })

    it('login guarda el token en storage y actualiza el usuario y computed', async () => {
        const respuestaLogin = {
            token: 'jwt-token-login',
            usuario: { uid: 'u123', nombre: 'Admin Master', rol: 'admin' },
        }
        vi.spyOn(authApi, 'login').mockResolvedValue(respuestaLogin)

        await auth.login({ email: 'admin@demo.com', password: 'Admin123!' })

        expect(tokenStorage.get()).toBe('jwt-token-login')
        expect(auth.isAuthenticated.value).toBe(true)
        expect(auth.isAdmin.value).toBe(true)
        expect(auth.state.user.nombre).toBe('Admin Master')
    })

    it('register guarda el token y actualiza como usuario estándar', async () => {
        const respuestaReg = {
            token: 'jwt-token-reg',
            usuario: { uid: 'u456', nombre: 'Nuevo Usuario', rol: 'usuario' },
        }
        vi.spyOn(authApi, 'registro').mockResolvedValue(respuestaReg)

        await auth.register({ nombre: 'Nuevo Usuario', email: 'nuevo@demo.com', password: 'Password123!' })

        expect(tokenStorage.get()).toBe('jwt-token-reg')
        expect(auth.isAuthenticated.value).toBe(true)
        expect(auth.isAdmin.value).toBe(false)
    })

    it('logout limpia el token en storage y resetea el usuario', () => {
        auth.setUser({ uid: 'u1', rol: 'usuario' })
        tokenStorage.set('token-activo')

        auth.logout()

        expect(tokenStorage.get()).toBeNull()
        expect(auth.state.user).toBeNull()
        expect(auth.isAuthenticated.value).toBe(false)
    })

    it('restoreSession recupera el usuario consultando authApi.perfil si hay token', async () => {
        auth.clearSession()
        tokenStorage.set('token-guardado')
        const perfilMock = { uid: 'u999', nombre: 'Recuperado', rol: 'usuario' }
        vi.spyOn(authApi, 'perfil').mockResolvedValue(perfilMock)

        await auth.restoreSession()

        expect(auth.state.user).toEqual(perfilMock)
        expect(auth.isAuthenticated.value).toBe(true)
    })

    it('restoreSession limpia la sesión si authApi.perfil falla con error', async () => {
        auth.clearSession()
        tokenStorage.set('token-invalido')
        vi.spyOn(authApi, 'perfil').mockRejectedValue(new Error('Token expirado'))

        await auth.restoreSession()

        expect(auth.state.user).toBeNull()
        expect(tokenStorage.get()).toBeNull()
        expect(auth.isAuthenticated.value).toBe(false)
    })
})
