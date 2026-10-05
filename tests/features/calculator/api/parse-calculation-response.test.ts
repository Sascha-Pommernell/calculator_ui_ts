import { describe, expect, it } from "vitest";
import { parseCalculationResponse } from "@/features/calculator/api/parse-calculation-response.ts";
import { InvalidResponseError } from "@/lib/api-client.ts";

describe("parseCalculationResponse", () => {
    it("parses a simple response", () => {
        expect(parseCalculationResponse('{"operation":"add","a":1,"b":2,"result":3}')).toEqual({
            operation: "add",
            a: 1,
            b: 2,
            result: "3",
        });
    });

    it("keeps the exact 28-digit result that JSON.parse would round", () => {
        const text = '{"operation":"divide","a":1,"b":3,"result":0.3333333333333333333333333333}';
        expect(parseCalculationResponse(text).result).toBe("0.3333333333333333333333333333");
    });

    it.each([
        ["negative", '{"operation":"subtract","a":1,"b":2,"result":-1}', "-1"],
        ["exponent", '{"operation":"multiply","a":1e-7,"b":1,"result":1e-7}', "1e-7"],
        ["positive exponent", '{"operation":"add","a":7e28,"b":0,"result":7e+28}', "7e+28"],
        ["decimal", '{"operation":"add","a":0.1,"b":0.2,"result":0.3}', "0.3"],
    ])("extracts %s literals verbatim", (_label, text, expected) => {
        expect(parseCalculationResponse(text).result).toBe(expected);
    });

    it("tolerates whitespace and key order", () => {
        const text = '{ "result": 2.5, "a": 10, "b": 4, "operation": "divide" }';
        expect(parseCalculationResponse(text)).toEqual({ operation: "divide", a: 10, b: 4, result: "2.5" });
    });

    it.each([
        ["malformed JSON", "{ not json"],
        ["array", "[1,2,3]"],
        ["unknown operation", '{"operation":"modulo","a":1,"b":2,"result":1}'],
        ["string result", '{"operation":"add","a":1,"b":2,"result":"3"}'],
        ["missing operand", '{"operation":"add","a":1,"result":3}'],
    ])("rejects %s", (_label, text) => {
        expect(() => parseCalculationResponse(text)).toThrow(InvalidResponseError);
    });
});
