import { Decimal } from "decimal.js";
import { HttpResponse, http } from "msw";
import { env } from "@/config/env.ts";

/**
 * Request handlers that emulate calculator_api_ts, including its decimal semantics
 * (29 significant digits, 28 decimal places, round half up) and hand-built JSON so
 * that the exact result literal reaches the client.
 */

const CalcDecimal = Decimal.clone({ precision: 29, rounding: Decimal.ROUND_HALF_UP, toExpPos: 29 });
const DECIMAL_MAX_ABS = new CalcDecimal("79228162514264337593543950335");
const DECIMAL_MAX_SCALE = 28;

export const VALIDATION_ERROR = "Body must contain finite numbers a and b within the decimal range";
export const DIVISION_BY_ZERO_ERROR = "Division by zero is not allowed";
export const OVERFLOW_ERROR = "Arithmetic overflow: result exceeds the decimal range";

type Op = (a: Decimal, b: Decimal) => Decimal;

const OPERATIONS: Record<string, Op> = {
    add: (a, b) => a.plus(b),
    subtract: (a, b) => a.minus(b),
    multiply: (a, b) => a.times(b),
    divide: (a, b) => a.div(b),
};

function isInRange(value: Decimal): boolean {
    return value.isFinite() && value.abs().lte(DECIMAL_MAX_ABS);
}

function isDecimalNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && isInRange(new CalcDecimal(value));
}

function errorResponse(error: string, status: number) {
    return HttpResponse.json({ error }, { status });
}

export const handlers = [
    http.get(`${env.API_URL}/health`, () => HttpResponse.json({ status: "ok" })),

    http.post(`${env.API_URL}/api/calculate/:operation`, async ({ request, params }) => {
        const operation = String(params["operation"]);
        const op = OPERATIONS[operation];
        if (!op) return errorResponse("Not found", 404);

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return errorResponse("Invalid JSON body", 400);
        }

        if (typeof body !== "object" || body === null || Array.isArray(body)) {
            return errorResponse(VALIDATION_ERROR, 400);
        }
        const { a, b } = body as Record<string, unknown>;
        if (!isDecimalNumber(a) || !isDecimalNumber(b)) return errorResponse(VALIDATION_ERROR, 400);

        const divisor = new CalcDecimal(b);
        if (operation === "divide" && divisor.isZero()) return errorResponse(DIVISION_BY_ZERO_ERROR, 400);

        const raw = op(new CalcDecimal(a), divisor);
        if (!isInRange(raw)) return errorResponse(OVERFLOW_ERROR, 400);
        const result = raw.toDecimalPlaces(DECIMAL_MAX_SCALE);

        return new HttpResponse(`{"operation":"${operation}","a":${a},"b":${b},"result":${result.toString()}}`, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
];
