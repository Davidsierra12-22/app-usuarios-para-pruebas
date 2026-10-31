import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'
import { authApi } from '@/services/authApi.js'
import { usersApi } from '@/services/usersApi.js'
import NotFoundView from '@/views/NotFoundView.vue'
import ProfileView from '@/views/ProfileView.vue'
import UserFormView from '@/views/UserFormView.vue'
import UsersView from '@/views/UsersView.vue'

vi.mock('@/services/authApi.js', () => ({
    authApi: {
        login: vi.fn(),
        registro: vi.fn(),
        perfil: vi.fn(),
        actualizarPerfil: vi.fn(),
        cambiarPassword: vi.fn(),
    },
}))

vi.mock('@/services/usersApi.js', () => ({
    usersApi: {
        listar: vi.fn(),
        obtener: vi.fn(),
        crear: vi.fn(),
        actualizar: vi.fn(),
        eliminar: vi.fn(),
    },
}))

const currentUser = {
    uid: 'admin-1',
    nombre: 'Admin Demo',
    email: 'admin@demo.com',
    rol: 'admin',
    createdAt: '2025-01-15T12:00:00.000Z',
}

const listedUser = {
    uid: 'user-1',
    nombre: 'Ana Demo',
    email: 'ana@demo.com',
    rol: 'usuario',
    createdAt: '2025-01-15T12:00:00.000Z',
}

function makeRouter() {
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', name: 'home', component: { template: '<div>Inicio</div>' } },
            { path: '/usuarios', name: 'users', component: { template: '<div>Usuarios</div>' } },
            { path: '/usuarios/nuevo', name: 'user-create', component: UserFormView },
            { path: '/usuarios/:id/editar', name: 'user-edit', component: UserFormView, props: true },
            { path: '/perfil', name: 'profile', component: ProfileView },
            { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
            { path: '/404', name: 'not-found', component: NotFoundView },
        ],
    })
}

async function mountAt(component, path, props = {}) {
    const router = makeRouter()
    await router.push(path)
    await router.isReady()
    const wrapper = mount(component, { props, global: { plugins: [router] } })
    await flushPromises()
    return { wrapper, router }
}

describe('Vistas y componentes restantes', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        const auth = useAuth()
        auth.clearSession()
        auth.setUser(currentUser)
        for (const toast of [...useToast().toasts]) useToast().dismiss(toast.id)
        usersApi.listar.mockResolvedValue({ usuarios: [], total: 0, pagina: 1, limite: 8, totalPaginas: 1 })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('perfil valida y guarda los datos personales y el cambio de contraseña', async () => {
        authApi.actualizarPerfil.mockResolvedValue({ ...currentUser, nombre: 'Admin Actualizado' })
        authApi.cambiarPassword.mockResolvedValue({ mensaje: 'Contraseña actualizada' })
        const { wrapper } = await mountAt(ProfileView, '/perfil')

        await wrapper.get('[data-test="profile-name"]').setValue('Admin Actualizado')
        await wrapper.get('[data-test="profile-form"]').trigger('submit.prevent')
        await flushPromises()
        expect(authApi.actualizarPerfil).toHaveBeenCalledWith({ nombre: 'Admin Actualizado', email: currentUser.email })
        expect(useToast().toasts.some(({ message }) => message === 'Perfil actualizado')).toBe(true)

        await wrapper.get('[data-test="password-current"]').setValue('Password123!')
        await wrapper.get('[data-test="password-new"]').setValue('NuevaClave123!')
        await wrapper.get('[data-test="password-confirmation"]').setValue('NuevaClave123!')
        await wrapper.get('[data-test="password-form"]').trigger('submit.prevent')
        await flushPromises()
        expect(authApi.cambiarPassword).toHaveBeenCalledWith({
            passwordActual: 'Password123!',
            passwordNueva: 'NuevaClave123!',
        })
        expect(wrapper.find('[data-test="password-server-error"]').exists()).toBe(false)
    })

    it('perfil bloquea campos inválidos antes de llamar a la API', async () => {
        const { wrapper } = await mountAt(ProfileView, '/perfil')
        await wrapper.get('[data-test="profile-name"]').setValue('x')
        await wrapper.get('[data-test="profile-email"]').setValue('correo-invalido')
        await wrapper.get('[data-test="profile-form"]').trigger('submit.prevent')

        expect(authApi.actualizarPerfil).not.toHaveBeenCalled()
        expect(wrapper.find('[data-test="profile-name-error"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="profile-email-error"]').exists()).toBe(true)
    })

    it('formulario crea usuarios y vuelve al listado tras el éxito', async () => {
        usersApi.crear.mockResolvedValue({ ...listedUser, uid: 'created-1' })
        const { wrapper, router } = await mountAt(UserFormView, '/usuarios/nuevo')
        await wrapper.get('[data-test="user-name"]').setValue('Nueva Persona')
        await wrapper.get('[data-test="user-email"]').setValue('nueva@demo.com')
        await wrapper.get('[data-test="user-password"]').setValue('Password123!')
        await wrapper.get('[data-test="user-form"]').trigger('submit.prevent')
        await flushPromises()

        expect(usersApi.crear).toHaveBeenCalledWith({
            nombre: 'Nueva Persona',
            email: 'nueva@demo.com',
            rol: 'usuario',
            password: 'Password123!',
        })
        expect(router.currentRoute.value.name).toBe('users')
    })

    it('formulario carga y actualiza usuarios existentes sin enviar contraseña vacía', async () => {
        usersApi.obtener.mockResolvedValue(listedUser)
        usersApi.actualizar.mockResolvedValue({ ...listedUser, nombre: 'Ana Actualizada' })
        const { wrapper, router } = await mountAt(UserFormView, '/usuarios/user-1/editar', { id: 'user-1' })

        expect(wrapper.get('[data-test="user-name"]').element.value).toBe('Ana Demo')
        await wrapper.get('[data-test="user-name"]').setValue('Ana Actualizada')
        await wrapper.get('[data-test="user-form"]').trigger('submit.prevent')
        await flushPromises()

        expect(usersApi.actualizar).toHaveBeenCalledWith('user-1', {
            nombre: 'Ana Actualizada',
            email: 'ana@demo.com',
            rol: 'usuario',
        })
        expect(router.currentRoute.value.name).toBe('users')
    })

    it('formulario muestra el estado no encontrado cuando la API responde 404', async () => {
        usersApi.obtener.mockRejectedValue({ status: 404, message: 'No encontrado', details: {} })
        const { wrapper } = await mountAt(UserFormView, '/usuarios/no-existe/editar', { id: 'no-existe' })
        expect(wrapper.get('[data-test="user-not-found"]').text()).toContain('El usuario no existe')
    })

    it('listado carga usuarios y confirma el borrado antes de refrescar', async () => {
        usersApi.listar
            .mockResolvedValueOnce({ usuarios: [listedUser], total: 1, pagina: 1, limite: 8, totalPaginas: 1 })
            .mockResolvedValueOnce({ usuarios: [], total: 0, pagina: 1, limite: 8, totalPaginas: 1 })
        usersApi.eliminar.mockResolvedValue({ mensaje: 'Usuario eliminado' })
        const { wrapper } = await mountAt(UsersView, '/usuarios')

        expect(wrapper.text()).toContain('ana@demo.com')
        await wrapper.get('[data-test="user-delete"]').trigger('click')
        expect(document.body.querySelector('[data-test="confirm-dialog"]')).not.toBeNull()
        document.body.querySelector('[data-test="confirm-accept"]').click()
        await flushPromises()

        expect(usersApi.eliminar).toHaveBeenCalledWith('user-1')
        expect(wrapper.find('[data-test="users-empty"]').exists()).toBe(true)
        expect(useToast().toasts.some(({ message }) => message.includes('Ana Demo eliminado'))).toBe(true)
    })

    it('encabezado muestra navegación de admin, permite cerrar menú y cerrar sesión', async () => {
        const router = makeRouter()
        await router.push('/usuarios')
        await router.isReady()
        const wrapper = mount(AppHeader, { global: { plugins: [router] } })

        expect(wrapper.get('[data-test="nav-users"]').exists()).toBe(true)
        expect(wrapper.get('[data-test="current-user-name"]').text()).toBe('Admin Demo')
        await wrapper.get('[aria-label="Abrir menú"]').trigger('click')
        expect(wrapper.get('[aria-label="Abrir menú"]').attributes('aria-expanded')).toBe('true')
        await wrapper.get('[data-test="logout"]').trigger('click')
        await flushPromises()

        expect(useAuth().state.user).toBeNull()
        expect(router.currentRoute.value.name).toBe('login')
    })

    it('notificaciones se muestran y pueden descartarse manualmente', async () => {
        const toast = useToast()
        toast.success('Aviso de prueba')
        const wrapper = mount(ToastContainer)
        expect(wrapper.get('[data-test="toast"]').text()).toContain('Aviso de prueba')
        await wrapper.get('[aria-label="Cerrar notificación"]').trigger('click')
        expect(wrapper.find('[data-test="toast"]').exists()).toBe(false)
    })

    it('página 404 ofrece una ruta para regresar al inicio', async () => {
        const router = makeRouter()
        await router.push('/404')
        await router.isReady()
        const wrapper = mount(NotFoundView, { global: { plugins: [router] } })
        expect(wrapper.get('h1').text()).toBe('Página no encontrada')
        expect(wrapper.get('[data-test="go-home"]').exists()).toBe(true)
    })
})