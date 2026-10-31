// ============================================================
// 🧪 Pruebas de vista: views/LoginView.vue
// Verifica validación local en el formulario y manejo de errores del servidor
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import { authApi } from '@/services/authApi.js'

// Mockeamos authApi para simular respuestas del backend
vi.mock('@/services/authApi.js', () => ({
    authApi: {
        login: vi.fn(),
        registro: vi.fn(),
        perfil: vi.fn(),
    },
}))

describe('Vista LoginView.vue', () => {
    let router

    beforeEach(() => {
        vi.clearAllMocks()
        router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
                { path: '/login', name: 'login', component: LoginView },
                { path: '/registro', name: 'register', component: { template: '<div>Registro</div>' } },
            ],
        })
    })

    it('con email inválido muestra el error en el formulario sin llamar a la API', async () => {
        const wrapper = mount(LoginView, {
            global: {
                plugins: [router],
            },
        })

        // Llenar email inválido y contraseña
        const emailInput = wrapper.get('[data-test="login-email"]')
        const passwordInput = wrapper.get('[data-test="login-password"]')
        await emailInput.setValue('correo-no-valido')
        await passwordInput.setValue('Password123!')

        // Enviar formulario
        await wrapper.get('[data-test="login-form"]').trigger('submit.prevent')

        // Comprobar que authApi.login NO fue llamado
        expect(authApi.login).not.toHaveBeenCalled()

        // El mensaje de error debe mostrarse en login-email-error
        const errorMsg = wrapper.find('[data-test="login-email-error"]')
        expect(errorMsg.exists()).toBe(true)
        expect(errorMsg.text()).toBe('El email no tiene un formato válido')
    })

    it('con error del servidor muestra el componente de alerta con el mensaje', async () => {
        // Simular que la API rechaza las credenciales
        authApi.login.mockRejectedValue(new Error('Credenciales inválidas'))

        const wrapper = mount(LoginView, {
            global: {
                plugins: [router],
            },
        })

        // Llenar datos con formato válido pero que el servidor rechazará
        await wrapper.get('[data-test="login-email"]').setValue('usuario@demo.com')
        await wrapper.get('[data-test="login-password"]').setValue('ClaveIncorrecta123!')

        // Enviar formulario
        await wrapper.get('[data-test="login-form"]').trigger('submit.prevent')
        await wrapper.vm.$nextTick()

        // Comprobar que sí llamó a la API
        expect(authApi.login).toHaveBeenCalledWith({
            email: 'usuario@demo.com',
            password: 'ClaveIncorrecta123!',
        })

        // Debe renderizar la alerta de error
        const alerta = wrapper.find('[data-test="alert"]')
        expect(alerta.exists()).toBe(true)
        expect(alerta.text()).toBe('Credenciales inválidas')
    })
})
