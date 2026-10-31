// ============================================================
// 🧪 Setup de pruebas de la Web (Frontend)
// Limpia localStorage y restaura mocks antes de cada prueba
// ============================================================

import { beforeEach, afterEach, vi } from 'vitest'

beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})
