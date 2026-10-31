import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/{unitarias,componentes,e2e}/**/*.test.js"],
    setupFiles: ["tests/setup.js"],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "secreto_super_seguro_para_pruebas_vitest",
      JWT_EXPIRA: "2h",
    },
    hookTimeout: 600_000,
    testTimeout: 30_000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "../evidencias/coverage/api",
      include: [
        "app.js",
        "controllers/**",
        "middlewares/**",
        "helpers/**",
        "models/**",
        "routes/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
