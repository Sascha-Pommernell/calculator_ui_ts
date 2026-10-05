import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/config/env.ts";
import { calculate } from "@/features/calculator/api/calculate.ts";
import { getHealth } from "@/features/calculator/api/get-health.ts";
import { ApiError, InvalidResponseError } from "@/lib/api-client.ts";
import { DIVISION_BY_ZERO_ERROR, OVERFLOW_ERROR, VALIDATION_ERROR } from "../../../mocks/handlers.ts";
import { server } from "../../../mocks/server.ts";

describe("calculate", () => {
    it.each([
        ["add", 1, 2, "3"],
        ["subtract", 1, 0.9, "0.1"],
        ["multiply", 1.1, 1.1, "1.21"],
        ["divide", 1, 3, "0.3333333333333333333333333333"],
        ["divide", 2, 3, "0.6666666666666666666666666667"],
    ] as const)("%s(%d, %d) yields the exact result %s", async (operation, a, b, expected) => {
        await expect(calculate({ operation, a, b })).resolves.toEqual({ operation, a, b, result: expected });
    });

    it.each([
        ["division by zero", { operation: "divide", a: 1, b: 0 }, DIVISION_BY_ZERO_ERROR],
        ["overflow", { operation: "multiply", a: 1e15, b: 1e15 }, OVERFLOW_ERROR],
        ["out-of-range operand", { operation: "add", a: 1e308, b: 1 }, VALIDATION_ERROR],
    ] as const)("surfaces the API message for %s", async (_label, input, message) => {
        const promise = calculate(input);
        await expect(promise).rejects.toBeInstanceOf(ApiError);
        await expect(promise).rejects.toMatchObject({ status: 400, message });
    });

    it("rejects a 200 response that violates the contract", async () => {
        server.use(http.post(`${env.API_URL}/api/calculate/add`, () => HttpResponse.json({ foo: "bar" })));

        await expect(calculate({ operation: "add", a: 1, b: 2 })).rejects.toBeInstanceOf(InvalidResponseError);
    });
});

describe("getHealth", () => {
    it("is true when /health answers 2xx", async () => {
        await expect(getHealth()).resolves.toBe(true);
    });

    it("is false on a non-2xx answer", async () => {
        server.use(http.get(`${env.API_URL}/health`, () => HttpResponse.text("", { status: 503 })));

        await expect(getHealth()).resolves.toBe(false);
    });

    it("is false when the API is unreachable", async () => {
        server.use(http.get(`${env.API_URL}/health`, () => HttpResponse.error()));

        await expect(getHealth()).resolves.toBe(false);
    });
});
