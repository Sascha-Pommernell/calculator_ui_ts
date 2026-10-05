export const OPERATIONS = ["add", "subtract", "multiply", "divide"] as const;

export type Operation = (typeof OPERATIONS)[number];

export interface OperationMeta {
    label: string;
    symbol: string;
}

export const OPERATION_META: Readonly<Record<Operation, OperationMeta>> = {
    add: { label: "Addieren", symbol: "+" },
    subtract: { label: "Subtrahieren", symbol: "−" },
    multiply: { label: "Multiplizieren", symbol: "×" },
    divide: { label: "Dividieren", symbol: "÷" },
};

export interface CalculationInput {
    operation: Operation;
    /** At least MIN_OPERANDS operands, evaluated left-associatively by the API. */
    numbers: number[];
}

/** The API requires at least two operands. */
export const MIN_OPERANDS = 2;

export interface CalculationResult extends CalculationInput {
    /**
     * Exact decimal result as sent by the API (up to 28 decimal places).
     * Kept as a string because a JavaScript number cannot represent it losslessly.
     */
    result: string;
}
