import { z } from "zod";

const VITE_PREFIX = "VITE_";

const EnvSchema = z.object({
    /** Base URL of the API as seen from the browser. Empty = same origin (proxy). */
    API_URL: z
        .string()
        .trim()
        .default("")
        .transform((value) => value.replace(/\/+$/, "")),
    HEALTH_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30_000),
    HISTORY_LIMIT: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof EnvSchema>;

function collectViteEnv(source: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
        if (key.startsWith(VITE_PREFIX) && value !== "") result[key.slice(VITE_PREFIX.length)] = value;
    }
    return result;
}

export function createEnv(source: Record<string, unknown> = import.meta.env): Env {
    const parsed = EnvSchema.safeParse(collectViteEnv(source));

    if (!parsed.success) {
        const issues = parsed.error.issues.map((issue) => `  ${VITE_PREFIX}${issue.path.join(".")}: ${issue.message}`);
        throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
    }

    return parsed.data;
}

export const env = createEnv();
