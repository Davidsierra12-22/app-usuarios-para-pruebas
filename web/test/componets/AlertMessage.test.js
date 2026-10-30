import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AlertMessage from '@/components/AlertMessage.vue'

describe('components/AlertMessage', () => {
	it('No pinta nada si no hay mensaje', () => {
		const wrapper = mount(AlertMessage)

		expect(wrapper.find('[data-test="alert"]').exists()).toBe(false)
	})

	it('Muestra el mensaje de error en AlertMessage', () => {
		const wrapper = mount(AlertMessage, {
			props: { message: 'Credenciales inválidas' },
		})
		const alerta = wrapper.get('[data-test="alert"]')

		expect(alerta.text()).toBe('Credenciales inválidas')
		expect(alerta.attributes('role')).toBe('alert')
	})

	it.each(['error', 'success', 'info'])('Aplica la clase del tipo %s', (type) => {
		const wrapper = mount(AlertMessage, {
			props: {
				message: 'Aviso',
				type,
			},
		})

		expect(wrapper.get('[data-test="alert"]').classes()).toContain(`alert--${type}`)
	})
})
