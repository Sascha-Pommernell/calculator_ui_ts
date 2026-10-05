import { describe, expect, it } from "vitest";
import { OPERAND_ERRORS, parseOperand } from "@/features/calculator/utils/operand.ts";

describe("parseOperand", () => {
    it.each([
        ["42", 42],
        ["-5", -5],
        ["+5", 5],
        ["0.1", 0.1],
        [".5", 0.5],
        ["5.", 5],
        ["1,5", 1.5],
        ["  7  ", 7],
        ["1e3", 1000],
        ["2.5E-2", 0.025],
        ["79228162514264337593543950335", 7.922816251426434e28],
    ])("accepts %j", (raw, expected) => {
        expect(parseOperand(raw)).toEqual({ ok: true, value: expected });
    });

    it.each(["", "   "])("rejects empty input %j", (raw) => {
        expect(parseOperand(raw)).toEqual({ ok: false, error: OPERAND_ERRORS.required });
    });

    it.each(["abc", "1.2.3", "1,2,3", "0x10", "Infinity", "NaN", "1e", "--1", "1 2"])(
        "rejects invalid literal %j",
        (raw) => {
            expect(parseOperand(raw)).toEqual({ ok: false, error: OPERAND_ERRORS.invalid });
        },
    );

    it("rejects literals that overflow to Infinity", () => {
        expect(parseOperand("1e400")).toEqual({ ok: false, error: OPERAND_ERRORS.notFinite });
    });
});
