import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validarRol } from '../../middlewares/validar-rol.js'

const crearRes = () => {
    const res = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
}

describe('validarRol', () => {
    let res
    let next

    beforeEach(() => {
        res = crearRes()
        next = vi.fn()
    })

    it('responde 403 si el rol del usuario no está permitido', () => {
        const req = { usuario: { rol: 'usuario' } }

        validarRol('admin')(req, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permisos para esto' })
        expect(next).not.toHaveBeenCalled()
    })

    it('llama a next si el rol está permitido', () => {
        const req = { usuario: { rol: 'admin' } }

        validarRol('admin')(req, res, next)

        expect(next).toHaveBeenCalledOnce()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('responde 500 si no se ejecutó antes validarJWT', () => {
        const req = {}

        validarRol('admin')(req, res, next)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Se requiere validarJWT primero' })
        expect(next).not.toHaveBeenCalled()
    })
})