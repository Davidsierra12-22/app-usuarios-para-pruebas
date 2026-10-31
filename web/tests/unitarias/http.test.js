// ============================================================
// 🧪 Pruebas unitarias: services/http.js
// Verifica peticiones HTTP, manejo de headers, serialización y errores
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { request, tokenStorage, setUnauthorizedHandler, ApiError } from '@/services/http.js'

describe('Servicio HTTP: services/http.js', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('envía el header x-token si hay un token guardado en tokenStorage', async () => {
        tokenStorage.set('mi-token-secreto')

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ status: 'ok' }),
        })
        vi.stubGlobal('fetch', fetchMock)

        await request('/test')

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const llamada = fetchMock.mock.calls[0]
        const opciones = llamada[1]
        expect(opciones.headers['x-token']).toBe('mi-token-secreto')
    })

    it('no incluye el header x-token si no hay token guardado', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ ok: true }),
        })
        vi.stubGlobal('fetch', fetchMock)

        await request('/public')

        const opciones = fetchMock.mock.calls[0][1]
        expect(opciones.headers['x-token']).toBeUndefined()
    })

    it('serializa el body como JSON y agrega el header Content-Type', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ recibido: true }),
        })
        vi.stubGlobal('fetch', fetchMock)

        const datos = { email: 'test@demo.com', nombre: 'Test' }
        await request('/usuarios', { method: 'POST', body: datos })

        const opciones = fetchMock.mock.calls[0][1]
        expect(opciones.headers['Content-Type']).toBe('application/json')
        expect(opciones.body).toBe(JSON.stringify(datos))
    })

    it('agrega parámetros query a la URL correctamente', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ total: 0 }),
        })
        vi.stubGlobal('fetch', fetchMock)

        await request('/usuarios', { query: { buscar: 'carlos', rol: 'admin' } })

        const urlLlamada = fetchMock.mock.calls[0][0].toString()
        expect(urlLlamada).toContain('buscar=carlos')
        expect(urlLlamada).toContain('rol=admin')
    })

    it('convierte respuesta con { error } en una instancia de ApiError con ese mensaje', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ error: 'Error de prueba' }),
        })
        vi.stubGlobal('fetch', fetchMock)

        await expect(request('/error-test')).rejects.toThrow(ApiError)
        try {
            await request('/error-test')
        } catch (err) {
            expect(err.message).toBe('Error de prueba')
            expect(err.status).toBe(400)
        }
    })

    it('convierte respuesta con { errores: [...] } en ApiError con details organizados por campo', async () => {
        const erroresApi = [
            { path: 'email', msg: 'Email inválido' },
            { path: 'password', msg: 'Muy corta' },
        ]
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ errores: erroresApi }),
        })
        vi.stubGlobal('fetch', fetchMock)

        try {
            await request('/form-error')
            expect.unreachable()
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError)
            expect(err.status).toBe(400)
            expect(err.details).toEqual({
                email: 'Email inválido',
                password: 'Muy corta',
            })
        }
    })

    it('si fetch falla por desconexión de red lanza ApiError con status 0', async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error('Network failure'))
        vi.stubGlobal('fetch', fetchMock)

        try {
            await request('/red-caida')
            expect.unreachable()
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError)
            expect(err.status).toBe(0)
            expect(err.message).toContain('No se pudo conectar con el servidor')
        }
    })

    it('con respuesta 401 y token guardado llama al manejador de setUnauthorizedHandler', async () => {
        tokenStorage.set('token-expirado')

        const handlerMock = vi.fn()
        setUnauthorizedHandler(handlerMock)

        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Token no válido o expirado' }),
        })
        vi.stubGlobal('fetch', fetchMock)

        await expect(request('/protegido')).rejects.toThrow(ApiError)
        expect(handlerMock).toHaveBeenCalledTimes(1)
    })
})
