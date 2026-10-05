export type OperandParseResult = { ok: true; value: number } | { ok: false; error: string };

// Plain decimal or scientific notation; rejects things Number() would accept (hex, "", "Infinity").
const NUMERIC_LITERAL = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

export const OPERAND_ERRORS = {
    required: "Bitte eine Zahl eingeben",
    invalid: "Ungültige Zahl",
    notFinite: "Zahl ist zu groß",
} as const;

/** Parses user input into a finite number. A comma is accepted as decimal separator. */
export function parseOperand(raw: string): OperandParseResult {
    const normalized = raw.trim().replace(",", ".");

    if (normalized === "") return { ok: false, error: OPERAND_ERRORS.required };
    if (!NUMERIC_LITERAL.test(normalized)) return { ok: false, error: OPERAND_ERRORS.invalid };

    const value = Number(normalized);
    if (!Number.isFinite(value)) return { ok: false, error: OPERAND_ERRORS.notFinite };

    return { ok: true, value };
}
