// ============================================================
// 🧪 Pruebas unitarias: authApi.js y usersApi.js
// Verifica que los servicios llaman a request() con rutas y métodos correctos
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as httpModule from '@/services/http.js'
import { authApi } from '@/services/authApi.js'
import { usersApi } from '@/services/usersApi.js'

describe('Servicios API (authApi y usersApi)', () => {
    let requestSpy

    beforeEach(() => {
        vi.restoreAllMocks()
        requestSpy = vi.spyOn(httpModule, 'request').mockResolvedValue({ ok: true })
    })

    describe('authApi', () => {
        it('login hace POST a /auth/login con credenciales', async () => {
            const creds = { email: 'a@b.com', password: '123' }
            await authApi.login(creds)
            expect(requestSpy).toHaveBeenCalledWith('/auth/login', { method: 'POST', body: creds })
        })

        it('registro hace POST a /auth/registro con datos', async () => {
            const datos = { nombre: 'Ana', email: 'a@b.com', password: '123' }
            await authApi.registro(datos)
            expect(requestSpy).toHaveBeenCalledWith('/auth/registro', { method: 'POST', body: datos })
        })

        it('perfil hace GET a /auth/perfil', async () => {
            await authApi.perfil()
            expect(requestSpy).toHaveBeenCalledWith('/auth/perfil')
        })

        it('actualizarPerfil hace PUT a /auth/perfil con datos', async () => {
            const datos = { nombre: 'Nuevo' }
            await authApi.actualizarPerfil(datos)
            expect(requestSpy).toHaveBeenCalledWith('/auth/perfil', { method: 'PUT', body: datos })
        })

        it('cambiarPassword hace PUT a /auth/password con datos', async () => {
            const datos = { passwordActual: '1', passwordNueva: '2' }
            await authApi.cambiarPassword(datos)
            expect(requestSpy).toHaveBeenCalledWith('/auth/password', { method: 'PUT', body: datos })
        })
    })

    describe('usersApi', () => {
        it('listar hace GET a /usuarios con query', async () => {
            const filtros = { buscar: 'ana', rol: 'usuario', pagina: 1, limite: 10 }
            await usersApi.listar(filtros)
            expect(requestSpy).toHaveBeenCalledWith('/usuarios', { query: filtros })
        })

        it('obtener hace GET a /usuarios/:id', async () => {
            await usersApi.obtener('u123')
            expect(requestSpy).toHaveBeenCalledWith('/usuarios/u123')
        })

        it('crear hace POST a /usuarios con body', async () => {
            const datos = { nombre: 'Nuevo User' }
            await usersApi.crear(datos)
            expect(requestSpy).toHaveBeenCalledWith('/usuarios', { method: 'POST', body: datos })
        })

        it('actualizar hace PUT a /usuarios/:id con body', async () => {
            const datos = { nombre: 'Editado' }
            await usersApi.actualizar('u123', datos)
            expect(requestSpy).toHaveBeenCalledWith('/usuarios/u123', { method: 'PUT', body: datos })
        })

        it('eliminar hace DELETE a /usuarios/:id', async () => {
            await usersApi.eliminar('u123')
            expect(requestSpy).toHaveBeenCalledWith('/usuarios/u123', { method: 'DELETE' })
        })
    })
})
