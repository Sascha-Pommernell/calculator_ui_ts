/**
 * Public API of the calculator feature.
 * Everything not exported here is an implementation detail (enforced by lint rules).
 */
export { Calculator } from "./components/Calculator.tsx";
export { ApiStatus } from "./components/ApiStatus.tsx";
export type { CalculationInput, CalculationResult, Operation } from "./types/index.ts";
