import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client.ts";
import type { MutationConfig } from "@/lib/react-query.ts";
import type { CalculationInput, CalculationResult } from "../types/index.ts";
import { parseCalculationResponse } from "./parse-calculation-response.ts";

export async function calculate(
    { operation, numbers }: CalculationInput,
    signal?: AbortSignal,
): Promise<CalculationResult> {
    const response = await apiClient.request(`/api/calculate/${operation}`, {
        method: "POST",
        body: { numbers },
        signal,
    });
    return parseCalculationResponse(await response.text());
}

export function useCalculate(config: MutationConfig<typeof calculate> = {}) {
    return useMutation({
        ...config,
        mutationFn: (input: CalculationInput) => calculate(input),
    });
}
