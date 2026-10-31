// ============================================================
// 🧪 Pruebas unitarias: utils/validators.js
// Verifica validaciones de nombre, email, contraseña y confirmación
// ============================================================

import { describe, it, expect } from 'vitest'
import {
    validateName,
    validateEmail,
    validatePassword,
    validatePasswordConfirmation,
    isValid,
} from '@/utils/validators.js'

describe('Validador: utils/validators.js', () => {
    // ------------------------------------------------------------
    // validateName
    // ------------------------------------------------------------
    describe('validateName', () => {
        it('devuelve error si el nombre está vacío o con espacios', () => {
            expect(validateName('')).toBe('El nombre es obligatorio')
            expect(validateName('   ')).toBe('El nombre es obligatorio')
        })

        it('devuelve error si tiene menos de 2 caracteres', () => {
            expect(validateName('A')).toBe('El nombre debe tener entre 2 y 60 caracteres')
        })

        it('devuelve error si tiene más de 60 caracteres', () => {
            const nombreLargo = 'A'.repeat(61)
            expect(validateName(nombreLargo)).toBe('El nombre debe tener entre 2 y 60 caracteres')
        })

        it('devuelve cadena vacía si el nombre es válido', () => {
            expect(validateName('Carlos Gomez')).toBe('')
        })
    })

    // ------------------------------------------------------------
    // validateEmail
    // ------------------------------------------------------------
    describe('validateEmail', () => {
        it('devuelve error si el email está vacío', () => {
            expect(validateEmail('')).toBe('El email es obligatorio')
            expect(validateEmail('   ')).toBe('El email es obligatorio')
        })

        it('devuelve error si el formato es inválido', () => {
            expect(validateEmail('correo-sin-arroba')).toBe('El email no tiene un formato válido')
            expect(validateEmail('correo@dominio')).toBe('El email no tiene un formato válido')
            expect(validateEmail('correo@.com')).toBe('El email no tiene un formato válido')
        })

        it('devuelve cadena vacía si el email tiene formato válido', () => {
            expect(validateEmail('usuario@dominio.com')).toBe('')
        })
    })

    // ------------------------------------------------------------
    // validatePassword
    // ------------------------------------------------------------
    describe('validatePassword', () => {
        it('devuelve error si la contraseña está vacía', () => {
            expect(validatePassword('')).toBe('La contraseña es obligatoria')
        })

        it('regla de longitud: devuelve error si tiene menos de 8 caracteres', () => {
            expect(validatePassword('Abc1')).toBe('La contraseña debe tener entre 8 y 64 caracteres')
        })

        it('regla de mayúscula: devuelve error si no incluye al menos una mayúscula', () => {
            expect(validatePassword('password123')).toBe('La contraseña debe incluir al menos una mayúscula')
        })

        it('regla de minúscula: devuelve error si no incluye al menos una minúscula', () => {
            expect(validatePassword('PASSWORD123')).toBe('La contraseña debe incluir al menos una minúscula')
        })

        it('regla de número: devuelve error si no incluye al menos un número', () => {
            expect(validatePassword('PasswordSinNumero')).toBe('La contraseña debe incluir al menos un número')
        })

        it('devuelve cadena vacía si cumple todas las reglas', () => {
            expect(validatePassword('PasswordValida123')).toBe('')
        })
    })

    // ------------------------------------------------------------
    // validatePasswordConfirmation
    // ------------------------------------------------------------
    describe('validatePasswordConfirmation', () => {
        it('devuelve error si la confirmación está vacía', () => {
            expect(validatePasswordConfirmation('Password123!', '')).toBe('Repite la contraseña')
        })

        it('devuelve error si las contraseñas no coinciden', () => {
            expect(validatePasswordConfirmation('Password123!', 'OtraPassword456!')).toBe(
                'Las contraseñas no coinciden',
            )
        })

        it('devuelve cadena vacía si ambas coinciden exactamente', () => {
            expect(validatePasswordConfirmation('Password123!', 'Password123!')).toBe('')
        })
    })

    // ------------------------------------------------------------
    // isValid
    // ------------------------------------------------------------
    describe('isValid', () => {
        it('devuelve true si el objeto de errores está vacío o solo contiene cadenas vacías', () => {
            expect(isValid({ email: '', password: '' })).toBe(true)
        })

        it('devuelve false si al menos un campo tiene un mensaje de error', () => {
            expect(isValid({ email: 'Email incorrecto', password: '' })).toBe(false)
        })
    })
})
