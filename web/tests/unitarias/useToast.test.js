// ============================================================
// 🧪 Pruebas unitarias: composables/useToast.js
// Verifica creación de notificaciones y su desaparición automática
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '@/composables/useToast.js'

describe('Composable: composables/useToast.js', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
    })

    it('success agrega un toast y se elimina solo tras 3500ms', () => {
        const toast = useToast()

        const id = toast.success('Operación exitosa')

        const item = toast.toasts.find((t) => t.id === id)
        expect(item).toBeDefined()
        expect(item.message).toBe('Operación exitosa')
        expect(item.type).toBe('success')

        // Avanzar el tiempo 3500ms
        vi.advanceTimersByTime(3500)

        const itemDespues = toast.toasts.find((t) => t.id === id)
        expect(itemDespues).toBeUndefined()
    })

    it('error agrega un toast de tipo error y se elimina solo tras 5000ms', () => {
        const toast = useToast()

        const id = toast.error('Hubo un error grave')

        const item = toast.toasts.find((t) => t.id === id)
        expect(item).toBeDefined()
        expect(item.message).toBe('Hubo un error grave')
        expect(item.type).toBe('error')

        // Antes de 5000ms sigue existiendo
        vi.advanceTimersByTime(4999)
        expect(toast.toasts.find((t) => t.id === id)).toBeDefined()

        // Al llegar a 5000ms se elimina
        vi.advanceTimersByTime(1)
        expect(toast.toasts.find((t) => t.id === id)).toBeUndefined()
    })

    it('dismiss elimina manualmente un toast antes de que expire su tiempo', () => {
        const toast = useToast()

        const id = toast.success('Mensaje temporal')
        expect(toast.toasts.find((t) => t.id === id)).toBeDefined()

        toast.dismiss(id)
        expect(toast.toasts.find((t) => t.id === id)).toBeUndefined()
    })
})
