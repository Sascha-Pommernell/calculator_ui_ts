import { z } from "zod";
import { InvalidResponseError } from "@/lib/api-client.ts";
import { MIN_OPERANDS, OPERATIONS } from "../types/index.ts";
import type { CalculationResult } from "../types/index.ts";

const CalculationResponseSchema = z.object({
    operation: z.enum(OPERATIONS),
    numbers: z.array(z.number()).min(MIN_OPERANDS),
    result: z.number(),
});

// Matches the raw numeric literal of "result" in the JSON text, e.g.
// `"result":0.3333333333333333333333333333` or `"result":1e-7`.
const RESULT_LITERAL = /"result"\s*:\s*(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/;

/**
 * Parses a successful calculation response.
 *
 * The API emits `result` with up to 28 decimal places. `JSON.parse` would round that to
 * double precision, so the exact literal is taken from the raw text instead.
 */
export function parseCalculationResponse(text: string): CalculationResult {
    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch {
        throw new InvalidResponseError();
    }

    const parsed = CalculationResponseSchema.safeParse(json);
    if (!parsed.success) throw new InvalidResponseError();

    const { operation, numbers, result } = parsed.data;
    const exact = RESULT_LITERAL.exec(text)?.[1];

    return { operation, numbers, result: exact ?? String(result) };
}
