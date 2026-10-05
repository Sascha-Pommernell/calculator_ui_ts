/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const DEFAULT_API_PROXY_TARGET = "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiProxyTarget = env["API_PROXY_TARGET"] || DEFAULT_API_PROXY_TARGET;

    return {
        plugins: [react()],
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        server: {
            // The API does not send CORS headers; in development the dev server forwards
            // API calls so that the UI can use same-origin requests.
            proxy: {
                "/api": { target: apiProxyTarget, changeOrigin: true },
                "/health": { target: apiProxyTarget, changeOrigin: true },
            },
        },
        test: {
            environment: "jsdom",
            setupFiles: ["./tests/setup.ts"],
            include: ["tests/**/*.test.{ts,tsx}"],
            css: false,
        },
    };
});
