import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 5173,
        // En desarrollo, /api se redirige a la API: el navegador no ve dos orígenes
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
    test: {
        environment: "jsdom",
        include: ["tests/**/*.test.js"],
        setupFiles: ["tests/setup.js"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "json-summary"],
            include: ["src/**"],
            exclude: ["src/main.js"],
            thresholds: {
                lines: 80,
                functions: 80,
                statements: 80,
                branches: 70,
            },
        },
    },
})
