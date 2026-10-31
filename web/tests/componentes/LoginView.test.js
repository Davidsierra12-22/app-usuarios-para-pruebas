// ============================================================
// 🧪 Pruebas de vista: views/LoginView.vue
// Verifica validación local en el formulario y manejo de errores del servidor
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import { authApi } from '@/services/authApi.js'
import { useAuth } from '@/composables/useAuth.js'

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
        useAuth().clearSession()
        router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
                { path: '/login', name: 'login', component: LoginView },
                { path: '/registro', name: 'register', component: RegisterView },
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

    it('registro con contraseña débil muestra errores locales y no llama a la API', async () => {
        await router.push('/registro')
        await router.isReady()
        const wrapper = mount(RegisterView, { global: { plugins: [router] } })

        await wrapper.get('[data-test="register-name"]').setValue('Ana Pérez')
        await wrapper.get('[data-test="register-email"]').setValue('ana@demo.com')
        await wrapper.get('[data-test="register-password"]').setValue('corta')
        await wrapper.get('[data-test="register-confirmation"]').setValue('corta')
        await wrapper.get('[data-test="register-form"]').trigger('submit.prevent')

        expect(authApi.registro).not.toHaveBeenCalled()
        expect(wrapper.get('[data-test="register-password-error"]').text()).toContain('entre 8 y 64 caracteres')
    })

    it('registro válido crea la sesión y redirige al inicio', async () => {
        authApi.registro.mockResolvedValue({
            token: 'token-registro',
            usuario: { uid: 'user-1', nombre: 'Ana Pérez', email: 'ana@demo.com', rol: 'usuario' },
        })
        await router.push('/registro')
        await router.isReady()
        const wrapper = mount(RegisterView, { global: { plugins: [router] } })

        await wrapper.get('[data-test="register-name"]').setValue('Ana Pérez')
        await wrapper.get('[data-test="register-email"]').setValue('ana@demo.com')
        await wrapper.get('[data-test="register-password"]').setValue('Password123!')
        await wrapper.get('[data-test="register-confirmation"]').setValue('Password123!')
        await wrapper.get('[data-test="register-form"]').trigger('submit.prevent')
        await flushPromises()

        expect(authApi.registro).toHaveBeenCalledWith({
            nombre: 'Ana Pérez',
            email: 'ana@demo.com',
            password: 'Password123!',
        })
        expect(router.currentRoute.value.name).toBe('home')
        expect(useAuth().isAuthenticated.value).toBe(true)
    })
})
