// ============================================================
// 🧪 Pruebas de componente: components/FormField.vue
// Verifica renderizado, binding de v-model, errores y toggle de contraseña
// ============================================================

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from '@/components/FormField.vue'

describe('Componente FormField.vue', () => {
    it('muestra una etiqueta asociada al campo mediante atributo for e id', () => {
        const wrapper = mount(FormField, {
            props: { label: 'Correo electrónico' },
        })
        const input = wrapper.get('input')
        const label = wrapper.get('label')

        expect(label.text()).toBe('Correo electrónico')
        expect(label.attributes('for')).toBe(input.attributes('id'))
    })

    it('configura el tipo, placeholder, autocomplete y valor inicial', () => {
        const wrapper = mount(FormField, {
            props: {
                label: 'Correo electrónico',
                type: 'email',
                placeholder: 'nombre@ejemplo.com',
                autocomplete: 'email',
                modelValue: 'ana@ejemplo.com',
            },
        })
        const input = wrapper.get('input')

        expect(input.attributes('type')).toBe('email')
        expect(input.attributes('placeholder')).toBe('nombre@ejemplo.com')
        expect(input.attributes('autocomplete')).toBe('email')
        expect(input.element.value).toBe('ana@ejemplo.com')
    })

    it('emite el nuevo valor update:modelValue al modificar el campo', async () => {
        const wrapper = mount(FormField, {
            props: { label: 'Nombre' },
        })

        await wrapper.get('input').setValue('Ana')

        expect(wrapper.emitted('update:modelValue')).toEqual([['Ana']])
    })

    it('muestra la pista hint cuando no hay error', () => {
        const wrapper = mount(FormField, {
            props: {
                label: 'Contraseña',
                hint: 'Usa al menos ocho caracteres',
                testId: 'password',
            },
        })
        const input = wrapper.get('[data-test="password"]')
        const hint = wrapper.get('.field__hint')

        expect(hint.text()).toBe('Usa al menos ocho caracteres')
        expect(input.attributes('aria-describedby')).toBe(hint.attributes('id'))
        expect(input.attributes('aria-invalid')).toBe('false')
    })

    it('muestra el error con data-test {testId}-error y oculta el hint', () => {
        const wrapper = mount(FormField, {
            props: {
                label: 'Correo electrónico',
                error: 'El correo no es válido',
                hint: 'Ingresa un correo de contacto',
                testId: 'email',
            },
        })
        const input = wrapper.get('[data-test="email"]')
        const error = wrapper.get('[data-test="email-error"]')

        expect(error.text()).toBe('El correo no es válido')
        expect(wrapper.find('.field__hint').exists()).toBe(false)
        expect(input.attributes('aria-invalid')).toBe('true')
        expect(input.attributes('aria-describedby')).toBe(error.attributes('id'))
        expect(wrapper.get('.field').classes()).toContain('field--error')
    })

    it('deshabilita el campo cuando disabled es true', () => {
        const wrapper = mount(FormField, {
            props: {
                label: 'Nombre',
                disabled: true,
            },
        })

        expect(wrapper.get('input').element.disabled).toBe(true)
    })

    it('el botón Mostrar/Ocultar cambia el tipo del input entre password y text', async () => {
        const wrapper = mount(FormField, {
            props: {
                label: 'Contraseña',
                type: 'password',
                testId: 'password',
            },
        })
        const input = wrapper.get('[data-test="password"]')
        const toggle = wrapper.get('[data-test="password-toggle"]')

        expect(input.attributes('type')).toBe('password')
        expect(toggle.attributes('aria-label')).toBe('Mostrar contraseña')

        await toggle.trigger('click')
        expect(input.attributes('type')).toBe('text')
        expect(toggle.attributes('aria-label')).toBe('Ocultar contraseña')

        await toggle.trigger('click')
        expect(input.attributes('type')).toBe('password')
    })
})
