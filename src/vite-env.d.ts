/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_HEALTH_POLL_INTERVAL_MS?: string;
    readonly VITE_HISTORY_LIMIT?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
