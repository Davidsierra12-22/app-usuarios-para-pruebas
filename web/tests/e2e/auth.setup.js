import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const adminState = fileURLToPath(new URL('./.auth/admin.json', import.meta.url))

// Se inicia sesión una sola vez; Playwright reutiliza este storageState en Chromium y Firefox.
test('inicia sesión con el administrador de la base E2E y guarda la sesión', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('login-email').fill('admin@demo.com')
    await page.getByTestId('login-password').fill('Admin123!')
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL(/\/usuarios$/)
    await expect(page.getByTestId('current-user-name')).toContainText('Administrador E2E')

    await mkdir(dirname(adminState), { recursive: true })
    await page.context().storageState({ path: adminState })
})
