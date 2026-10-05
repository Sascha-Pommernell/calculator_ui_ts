import { describe, expect, it } from "vitest";
import { createEnv } from "@/config/env.ts";

describe("createEnv", () => {
    it("applies defaults when nothing is configured", () => {
        expect(createEnv({})).toEqual({ API_URL: "", HEALTH_POLL_INTERVAL_MS: 30_000, HISTORY_LIMIT: 10 });
    });

    it("reads VITE_-prefixed variables and strips a trailing slash from the API URL", () => {
        const env = createEnv({
            VITE_API_URL: "https://api.example.com/",
            VITE_HEALTH_POLL_INTERVAL_MS: "5000",
            VITE_HISTORY_LIMIT: "3",
            UNRELATED: "ignored",
        });

        expect(env).toEqual({ API_URL: "https://api.example.com", HEALTH_POLL_INTERVAL_MS: 5000, HISTORY_LIMIT: 3 });
    });

    it("treats empty strings as unset", () => {
        expect(createEnv({ VITE_HISTORY_LIMIT: "" }).HISTORY_LIMIT).toBe(10);
    });

    it("fails fast with a readable message on invalid values", () => {
        expect(() => createEnv({ VITE_HISTORY_LIMIT: "many" })).toThrow(/VITE_HISTORY_LIMIT/);
        expect(() => createEnv({ VITE_HEALTH_POLL_INTERVAL_MS: "-1" })).toThrow(/VITE_HEALTH_POLL_INTERVAL_MS/);
    });
});
