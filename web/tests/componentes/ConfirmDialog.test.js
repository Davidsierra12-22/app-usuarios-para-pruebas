// ============================================================
// 🧪 Pruebas de componente: components/ConfirmDialog.vue
// Verifica renderizado condicional y emisión de eventos confirm y cancel
// ============================================================

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

describe('Componente ConfirmDialog.vue', () => {
    it('no renderiza el diálogo si open es false', () => {
        const wrapper = mount(ConfirmDialog, {
            props: { open: false },
            global: {
                stubs: { Teleport: true },
            },
        })

        expect(wrapper.find('[data-test="confirm-dialog"]').exists()).toBe(false)
    })

    it('renderiza título, mensaje y emite confirm y cancel con los botones correspondientes', async () => {
        const wrapper = mount(ConfirmDialog, {
            props: {
                open: true,
                title: '¿Eliminar usuario?',
                message: 'Esta acción no se puede deshacer',
                confirmText: 'Sí, eliminar',
            },
            global: {
                stubs: { Teleport: true },
            },
        })

        const dialog = wrapper.find('[data-test="confirm-dialog"]')
        expect(dialog.exists()).toBe(true)
        expect(dialog.text()).toContain('¿Eliminar usuario?')
        expect(dialog.text()).toContain('Esta acción no se puede deshacer')

        // Clic en cancelar emite evento 'cancel'
        const cancelBtn = wrapper.find('[data-test="confirm-cancel"]')
        await cancelBtn.trigger('click')
        expect(wrapper.emitted('cancel')).toBeTruthy()

        // Clic en confirmar emite evento 'confirm'
        const acceptBtn = wrapper.find('[data-test="confirm-accept"]')
        await acceptBtn.trigger('click')
        expect(wrapper.emitted('confirm')).toBeTruthy()
    })

    it('deshabilita los botones cuando loading es true', () => {
        const wrapper = mount(ConfirmDialog, {
            props: {
                open: true,
                loading: true,
            },
            global: {
                stubs: { Teleport: true },
            },
        })

        const cancelBtn = wrapper.get('[data-test="confirm-cancel"]')
        const acceptBtn = wrapper.get('[data-test="confirm-accept"]')

        expect(cancelBtn.attributes('disabled')).toBeDefined()
        expect(acceptBtn.attributes('disabled')).toBeDefined()
        expect(acceptBtn.text()).toContain('Procesando…')
    })
})
