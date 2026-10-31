import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const evidenceRoot = fileURLToPath(new URL('../../../evidencias/playwright/', import.meta.url))
const uniqueTag = () => randomUUID().replaceAll('-', '').slice(0, 12)

async function screenshot(page, browserName, flow) {
    const path = resolve(evidenceRoot, browserName, `${flow}.png`)
    await mkdir(dirname(path), { recursive: true })
    await page.screenshot({ path, fullPage: true })
}

async function createGuestPage(browser) {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    return { context, page: await context.newPage() }
}

test('login con credenciales inválidas muestra el error y conserva la ruta', async ({ browser, browserName }) => {
    const { context, page } = await createGuestPage(browser)
    try {
        await page.goto('/login')
        await page.getByTestId('login-email').fill(`missing-${uniqueTag()}@demo.com`)
        await page.getByTestId('login-password').fill('PasswordIncorrecta123!')
        await page.getByTestId('login-submit').click()

        await expect(page.getByTestId('alert')).toContainText('Credenciales inválidas')
        await expect(page).toHaveURL(/\/login$/)
        await screenshot(page, browserName, 'login-invalido')
    } finally {
        await context.close()
    }
})

test('registro, perfil, cambio de contraseña y restricción de rol usuario', async ({ browser, browserName }) => {
    const { context, page } = await createGuestPage(browser)
    const tag = uniqueTag()
    const email = `e2e-${tag}@demo.com`
    const oldPassword = 'Password123!'
    const newPassword = 'NuevaClave456!'
    try {
        await page.goto('/registro')
        await page.getByTestId('register-name').fill(`Usuario E2E ${tag}`)
        await page.getByTestId('register-email').fill(email)
        await page.getByTestId('register-password').fill(oldPassword)
        await page.getByTestId('register-confirmation').fill(oldPassword)
        await page.getByTestId('register-submit').click()

        await expect(page).toHaveURL(/\/perfil$/)
        await expect(page.getByTestId('profile-role')).toContainText('Usuario')
        await page.getByTestId('password-current').fill(oldPassword)
        await page.getByTestId('password-new').fill(newPassword)
        await page.getByTestId('password-confirmation').fill(newPassword)
        await page.getByTestId('password-form').evaluate((form) => form.requestSubmit())
        await expect(page.getByText('Contraseña actualizada')).toBeVisible()
        await screenshot(page, browserName, 'registro-perfil-password')

        await page.getByTestId('logout').click()
        await expect(page).toHaveURL(/\/login$/)
        await page.getByTestId('login-email').fill(email)
        await page.getByTestId('login-password').fill(newPassword)
        await page.getByTestId('login-submit').click()
        await expect(page).toHaveURL(/\/perfil$/)

        await page.goto('/usuarios')
        await expect(page).toHaveURL(/\/perfil$/)
    } finally {
        await context.close()
    }
})

test('admin busca, edita y elimina usuario; la cuenta eliminada ya no inicia sesión', async ({ page, browserName }) => {
    const tag = uniqueTag()
    const email = `crud-${tag}@demo.com`
    const password = 'Password123!'

    await page.goto('/usuarios')
    await expect(page.getByTestId('users-table')).toBeVisible()
    await page.getByTestId('users-new').click()
    await page.getByTestId('user-name').fill(`Usuario CRUD ${tag}`)
    await page.getByTestId('user-email').fill(email)
    await page.getByTestId('user-password').fill(password)
    await page.getByTestId('user-submit').click()

    await page.getByTestId('users-search').fill(email)
    const row = page.getByTestId('user-row').filter({ hasText: email })
    await expect(row).toBeVisible()
    await expect(row).toHaveCount(1)
    await row.getByTestId('user-edit').click()
    await expect(page.getByTestId('user-name')).toHaveValue(`Usuario CRUD ${tag}`)
    await page.getByTestId('user-name').fill(`Editado CRUD ${tag}`)
    await page.getByTestId('user-form').evaluate((form) => form.requestSubmit())

    const editedRow = page.getByTestId('user-row').filter({ hasText: email })
    await expect(editedRow).toContainText(`Editado CRUD ${tag}`)
    await editedRow.getByTestId('user-delete').click()
    await expect(page.locator('body').getByTestId('confirm-dialog')).toBeVisible()
    await page.locator('body').getByTestId('confirm-accept').click()
    await expect(page.getByText(`Usuario Editado CRUD ${tag} eliminado`)).toBeVisible()
    await expect(editedRow).toHaveCount(0)
    await screenshot(page, browserName, 'admin-crud-borrado')

    await page.getByTestId('logout').click()
    await expect(page).toHaveURL(/\/login$/)
    await page.getByTestId('login-email').fill(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('alert')).toContainText('Usuario desactivado')
    await expect(page).toHaveURL(/\/login$/)
})

test('filtros y paginación conservan el estado de búsqueda en la URL', async ({ page, request, browserName }) => {
    const tag = uniqueTag()
    const prefix = `Pagina${tag}`
    const login = await request.post('/api/auth/login', {
        data: { email: 'admin@demo.com', password: 'Admin123!' },
    })
    expect(login.ok()).toBeTruthy()
    const { token } = await login.json()

    for (let index = 0; index < 9; index += 1) {
        const response = await request.post('/api/usuarios', {
            headers: { 'x-token': token },
            data: {
                nombre: `${prefix} Usuario ${index + 1}`,
                email: `${prefix.toLowerCase()}-${index + 1}@demo.com`,
                password: 'Password123!',
                rol: 'usuario',
            },
        })
        expect(response.status()).toBe(201)
    }

    await page.goto(`/usuarios?buscar=${encodeURIComponent(prefix)}`)
    await expect(page.getByTestId('users-total')).toContainText('9 usuarios activos')
    await expect(page.getByTestId('user-row')).toHaveCount(8)
    await expect(page.getByTestId('pagination-info')).toContainText('1–8 de 9')
    await page.getByTestId('pagination-next').click()

    await expect(page).toHaveURL(/pagina=2/)
    await expect(page.getByTestId('user-row')).toHaveCount(1)
    await expect(page.getByTestId('pagination-info')).toContainText('9–9 de 9')
    await screenshot(page, browserName, 'busqueda-paginacion')
})

test('sesión del administrador se restaura al recargar y la ruta inexistente da 404', async ({ page, browserName }) => {
    await page.goto('/usuarios')
    await expect(page.getByTestId('current-user-name')).toContainText('Administrador E2E')
    await page.reload()
    await expect(page.getByTestId('users-table')).toBeVisible()

    await page.goto('/ruta-e2e-inexistente')
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible()
    await screenshot(page, browserName, 'ruta-no-encontrada')
})
