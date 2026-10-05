import { OPERATION_META } from "../types/index.ts";
import type { CalculationInput } from "../types/index.ts";

export function formatExpression({ operation, numbers }: CalculationInput): string {
    return numbers.join(` ${OPERATION_META[operation].symbol} `);
}
