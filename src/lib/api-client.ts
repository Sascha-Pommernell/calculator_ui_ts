import { env } from "@/config/env.ts";

/** The API answered with an error status (4xx/5xx). */
export class ApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

/** The API could not be reached (offline, DNS, CORS, connection refused, dead proxy upstream). */
export class NetworkError extends Error {
    constructor(cause?: unknown) {
        super("Die API ist nicht erreichbar", { cause });
        this.name = "NetworkError";
    }
}

/** The API answered with 2xx but the body did not match the expected contract. */
export class InvalidResponseError extends Error {
    constructor(message = "Unerwartete Antwort der API") {
        super(message);
        this.name = "InvalidResponseError";
    }
}

export function isAbortError(error: unknown): boolean {
    // Not `instanceof DOMException`: the error may originate from a different realm (e.g. Node vs. jsdom).
    return error instanceof Error && error.name === "AbortError";
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError || error instanceof NetworkError || error instanceof InvalidResponseError) {
        return error.message;
    }
    return "Unbekannter Fehler";
}

const GATEWAY_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);

function extractErrorMessage(text: string): string | undefined {
    try {
        const body: unknown = JSON.parse(text);
        if (typeof body === "object" && body !== null && "error" in body && typeof body.error === "string") {
            return body.error;
        }
    } catch {
        // not JSON
    }
    return undefined;
}

export interface ApiRequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    /** Serialized as JSON. */
    body?: unknown;
    signal?: AbortSignal | undefined;
    headers?: Record<string, string>;
}

export interface ApiClientOptions {
    baseUrl?: string;
    fetchFn?: typeof fetch;
}

export interface ApiClient {
    /**
     * Sends a request and resolves with the raw `Response` once it is known to be successful.
     * Non-2xx responses and transport failures are mapped to typed errors.
     */
    request(path: string, options?: ApiRequestOptions): Promise<Response>;
}

export function createApiClient({ baseUrl = env.API_URL, fetchFn }: ApiClientOptions = {}): ApiClient {
    const doFetch: typeof fetch = fetchFn ?? ((input, init) => globalThis.fetch(input, init));

    return {
        async request(path, { method = "GET", body, signal, headers = {} } = {}) {
            const init: RequestInit = {
                method,
                headers: { Accept: "application/json", ...headers },
                signal,
            };
            if (body !== undefined) {
                init.headers = { ...init.headers, "Content-Type": "application/json" };
                init.body = JSON.stringify(body);
            }

            let response: Response;
            try {
                response = await doFetch(`${baseUrl}${path}`, init);
            } catch (error) {
                if (isAbortError(error)) throw error;
                throw new NetworkError(error);
            }

            if (response.ok) return response;

            const message = extractErrorMessage(await response.text());
            if (message !== undefined) throw new ApiError(message, response.status);
            if (GATEWAY_STATUSES.has(response.status)) throw new NetworkError();
            throw new ApiError(`Unerwarteter Fehler (HTTP ${response.status})`, response.status);
        },
    };
}

export const apiClient = createApiClient();
