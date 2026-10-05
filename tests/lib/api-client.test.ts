import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/config/env.ts";
import { ApiError, NetworkError, createApiClient, getErrorMessage } from "@/lib/api-client.ts";
import { server } from "../mocks/server.ts";

const client = createApiClient();
const url = (path: string) => `${env.API_URL}${path}`;

describe("createApiClient", () => {
    it("sends JSON bodies with the right headers and resolves successful responses", async () => {
        let received: { method: string; contentType: string | null; accept: string | null; body: unknown } | undefined;
        server.use(
            http.post(url("/echo"), async ({ request }) => {
                received = {
                    method: request.method,
                    contentType: request.headers.get("content-type"),
                    accept: request.headers.get("accept"),
                    body: await request.json(),
                };
                return HttpResponse.json({ ok: true });
            }),
        );

        const response = await client.request("/echo", { method: "POST", body: { a: 1, b: 2 } });

        expect(response.ok).toBe(true);
        expect(received).toEqual({
            method: "POST",
            contentType: "application/json",
            accept: "application/json",
            body: { a: 1, b: 2 },
        });
    });

    it("does not send a body or content-type on GET", async () => {
        let contentType: string | null = "unset";
        server.use(
            http.get(url("/ping"), ({ request }) => {
                contentType = request.headers.get("content-type");
                return HttpResponse.text("pong");
            }),
        );

        await client.request("/ping");

        expect(contentType).toBeNull();
    });

    it("maps an API error body to ApiError with the server message", async () => {
        server.use(http.post(url("/fail"), () => HttpResponse.json({ error: "Nope" }, { status: 400 })));

        const promise = client.request("/fail", { method: "POST", body: {} });

        await expect(promise).rejects.toBeInstanceOf(ApiError);
        await expect(promise).rejects.toMatchObject({ status: 400, message: "Nope" });
    });

    it("falls back to a generic message when the error body is not JSON", async () => {
        server.use(http.get(url("/boom"), () => HttpResponse.text("Server Error", { status: 500 })));

        await expect(client.request("/boom")).rejects.toMatchObject({
            status: 500,
            message: "Unerwarteter Fehler (HTTP 500)",
        });
    });

    it.each([502, 503, 504])("treats a gateway %d without API body as unreachable", async (status) => {
        server.use(http.get(url("/gateway"), () => HttpResponse.text("Bad Gateway", { status })));

        await expect(client.request("/gateway")).rejects.toBeInstanceOf(NetworkError);
    });

    it("prefers the API error body over the gateway heuristic", async () => {
        server.use(http.get(url("/maintenance"), () => HttpResponse.json({ error: "Maintenance" }, { status: 503 })));

        await expect(client.request("/maintenance")).rejects.toMatchObject({ status: 503, message: "Maintenance" });
    });

    it("wraps transport failures in NetworkError", async () => {
        server.use(http.get(url("/offline"), () => HttpResponse.error()));

        await expect(client.request("/offline")).rejects.toBeInstanceOf(NetworkError);
    });

    it("re-throws AbortError unchanged", async () => {
        server.use(http.get(url("/slow"), async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return HttpResponse.text("late");
        }));
        const controller = new AbortController();

        const promise = client.request("/slow", { signal: controller.signal });
        controller.abort();

        await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    });

    it("honours an explicit baseUrl", async () => {
        server.use(http.get("https://other.example.com/x", () => HttpResponse.text("ok")));

        const response = await createApiClient({ baseUrl: "https://other.example.com" }).request("/x");

        expect(await response.text()).toBe("ok");
    });
});

describe("getErrorMessage", () => {
    it("returns the message of known errors and a generic one otherwise", () => {
        expect(getErrorMessage(new ApiError("Nope", 400))).toBe("Nope");
        expect(getErrorMessage(new NetworkError())).toBe("Die API ist nicht erreichbar");
        expect(getErrorMessage(new Error("internal"))).toBe("Unbekannter Fehler");
        expect(getErrorMessage("string")).toBe("Unbekannter Fehler");
    });
});
