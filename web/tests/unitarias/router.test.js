// ============================================================
// 🧪 Pruebas unitarias: Guardas del router (src/router/index.js)
// Verifica redirecciones de meta: requiresAuth, guestOnly y requiresAdmin
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import router from '@/router/index.js'
import { useAuth } from '@/composables/useAuth.js'
import { authApi } from '@/services/authApi.js'
import { tokenStorage } from '@/services/http.js'

describe('Guardas del Router (router/index.js)', () => {
    let auth

    beforeEach(async () => {
        auth = useAuth()
        auth.clearSession()
        vi.restoreAllMocks()
    })

    it('ruta protegida con meta.requiresAuth redirige a login si el usuario no tiene sesión', async () => {
        await router.push('/perfil')

        expect(router.currentRoute.value.name).toBe('login')
        expect(router.currentRoute.value.query.redirect).toBe('/perfil')
    })

    it('ruta de invitados con meta.guestOnly redirige a home si el usuario ya está autenticado', async () => {
        const usuarioMock = { uid: 'u1', nombre: 'Usuario Normal', rol: 'usuario' }
        tokenStorage.set('token-valido')
        vi.spyOn(authApi, 'perfil').mockResolvedValue(usuarioMock)

        await router.push('/login')

        // Como es usuario estándar, '/' redirige a 'profile'
        expect(router.currentRoute.value.name).toBe('profile')
    })

    it('ruta de administración con meta.requiresAdmin redirige a profile si el usuario no es admin', async () => {
        const usuarioMock = { uid: 'u2', nombre: 'Usuario Normal', rol: 'usuario' }
        tokenStorage.set('token-valido')
        vi.spyOn(authApi, 'perfil').mockResolvedValue(usuarioMock)

        await router.push('/usuarios')

        expect(router.currentRoute.value.name).toBe('profile')
    })

    it('ruta de administración permite el acceso si el usuario tiene rol admin', async () => {
        const adminMock = { uid: 'admin-1', nombre: 'Admin Master', rol: 'admin' }
        tokenStorage.set('token-admin')
        vi.spyOn(authApi, 'perfil').mockResolvedValue(adminMock)

        await router.push('/usuarios')

        expect(router.currentRoute.value.name).toBe('users')
    })
})
