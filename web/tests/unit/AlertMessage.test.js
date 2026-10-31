// ============================================================
// 🧪 Pruebas de componente: components/AlertMessage.vue
// Verifica renderizado condicional, contenido del mensaje y clases de tipo
// ============================================================

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AlertMessage from '@/components/AlertMessage.vue'

describe('Componente AlertMessage.vue', () => {
    it('no pinta nada si no se le pasa ningún mensaje', () => {
        const wrapper = mount(AlertMessage)

        expect(wrapper.find('[data-test="alert"]').exists()).toBe(false)
    })

    it('muestra el mensaje de alerta y tiene role="alert"', () => {
        const wrapper = mount(AlertMessage, {
            props: { message: 'Credenciales inválidas' },
        })
        const alerta = wrapper.get('[data-test="alert"]')

        expect(alerta.text()).toBe('Credenciales inválidas')
        expect(alerta.attributes('role')).toBe('alert')
    })

    it.each(['error', 'success', 'info'])('aplica la clase css correspondiente al tipo %s', (type) => {
        const wrapper = mount(AlertMessage, {
            props: {
                message: 'Aviso de prueba',
                type,
            },
        })

        expect(wrapper.get('[data-test="alert"]').classes()).toContain(`alert--${type}`)
    })
})
