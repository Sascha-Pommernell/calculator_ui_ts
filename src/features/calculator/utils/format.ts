import { OPERATION_META } from "../types/index.ts";
import type { CalculationInput } from "../types/index.ts";

export function formatExpression({ operation, a, b }: CalculationInput): string {
    return `${a} ${OPERATION_META[operation].symbol} ${b}`;
}
