import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["test/**/*.test.js"],
        env: {
            NODE_ENV: "test",
            JWT_SECRET: "secreto",
            JWT_EXPIRA: "1h",
        },
        hookTimeout: 60_000,
        coverage: {
            provider: "v8",
            reporter: ["text","html"],
            include: ["controllers/**", "helpers/**", "middlewares/**", "routes/**"]
        }
    }
});