// ============================================================
// 🧪 Pruebas de componente: components/PaginationBar.vue
// Verifica texto de paginación, deshabilitado en extremos y evento change
// ============================================================

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PaginationBar from '@/components/PaginationBar.vue'

describe('Componente PaginationBar.vue', () => {
    it('muestra el texto "Mostrando X–Y de Z", deshabilita Anterior en página 1 y emite change al avanzar', async () => {
        const wrapper = mount(PaginationBar, {
            props: { page: 1, totalPages: 3, total: 20, limit: 8 },
        })

        const $ = (id) => wrapper.find(`[data-test=${id}]`)

        // Comprobar formato del texto
        expect($('pagination-info').text()).toContain('1–8 de 20')

        // En la página 1, el botón Anterior debe estar deshabilitado
        expect($('pagination-prev').attributes('disabled')).toBeDefined()

        // El botón Siguiente debe estar habilitado
        expect($('pagination-next').attributes('disabled')).toBeUndefined()

        // Al hacer clic en Siguiente, debe emitir change con la página 2
        await $('pagination-next').trigger('click')
        expect(wrapper.emitted('change')[0]).toEqual([2])
    })

    it('en la última página deshabilita Siguiente y permite retroceder con Anterior', async () => {
        const wrapper = mount(PaginationBar, {
            props: { page: 3, totalPages: 3, total: 20, limit: 8 },
        })

        const $ = (id) => wrapper.find(`[data-test=${id}]`)

        // Comprobar rango en la última página (17–20 de 20)
        expect($('pagination-info').text()).toContain('17–20 de 20')

        // En la última página, Siguiente debe estar deshabilitado
        expect($('pagination-next').attributes('disabled')).toBeDefined()

        // Anterior debe estar habilitado
        expect($('pagination-prev').attributes('disabled')).toBeUndefined()

        // Al hacer clic en Anterior, debe emitir change con la página 2
        await $('pagination-prev').trigger('click')
        expect(wrapper.emitted('change')[0]).toEqual([2])
    })

    it('muestra 0 cuando el total es 0', () => {
        const wrapper = mount(PaginationBar, {
            props: { page: 1, totalPages: 1, total: 0, limit: 8 },
        })

        expect(wrapper.find('[data-test="pagination-info"]').text()).toContain('0–0 de 0')
    })
})
