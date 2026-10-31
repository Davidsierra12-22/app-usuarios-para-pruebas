import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const adminState = fileURLToPath(new URL('./tests/e2e/.auth/admin.json', import.meta.url))

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.spec.js',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    timeout: 45_000,
    expect: { timeout: 8_000 },
    reporter: [
        ['list'],
        ['html', { outputFolder: '../evidencias/playwright/report', open: 'never' }],
    ],
    outputDir: '../evidencias/playwright/test-results',
    use: {
        baseURL: 'http://127.0.0.1:5173',
        testIdAttribute: 'data-test',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'setup',
            testMatch: '**/auth.setup.js',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'chromium',
            testMatch: '**/*.spec.js',
            dependencies: ['setup'],
            use: { ...devices['Desktop Chrome'], storageState: adminState },
        },
        {
            name: 'firefox',
            testMatch: '**/*.spec.js',
            dependencies: ['setup'],
            use: { ...devices['Desktop Firefox'], storageState: adminState },
        },
    ],
    webServer: [
        {
            command: 'npm run dev',
            cwd: '../api',
            url: 'http://127.0.0.1:3000/api/health',
            reuseExistingServer: false,
            timeout: 90_000,
            env: {
                NODE_ENV: 'test-e2e',
                PUERTO: '3000',
                MONGODB_CNX: 'mongodb://127.0.0.1:27017/app-usuarios-e2e',
                JWT_SECRET: 'clave-local-exclusiva-para-e2e-no-usar-en-produccion',
                JWT_EXPIRA: '2h',
                ADMIN_NOMBRE: 'Administrador E2E',
                ADMIN_EMAIL: 'admin@demo.com',
                ADMIN_PASSWORD: 'Admin123!',
            },
        },
        {
            command: 'npm run dev -- --host 127.0.0.1',
            url: 'http://127.0.0.1:5173',
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
        },
    ],
})