import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button/index.ts";
import { NumberField } from "@/components/ui/form/index.ts";
import { MIN_OPERANDS } from "../types/index.ts";
import type { CalculationInput, Operation } from "../types/index.ts";
import { parseOperand } from "../utils/operand.ts";
import styles from "./CalculatorForm.module.css";
import { OperationSelect } from "./OperationSelect.tsx";

interface CalculatorFormProps {
    onSubmit: (values: CalculationInput) => void;
    isSubmitting: boolean;
}

interface OperandField {
    /** Stable key so that removing a field in the middle keeps the others' state. */
    id: number;
    value: string;
    error?: string;
}

const OPERAND_LABEL_PREFIX = "Zahl";
const ADD_OPERAND_LABEL = "Zahl hinzufügen";

const operandLabel = (position: number): string => `${OPERAND_LABEL_PREFIX} ${position}`;
const removeOperandLabel = (position: number): string => `${operandLabel(position)} entfernen`;

function createInitialOperands(): OperandField[] {
    return Array.from({ length: MIN_OPERANDS }, (_, index) => ({ id: index, value: "" }));
}

export function CalculatorForm({ onSubmit, isSubmitting }: CalculatorFormProps) {
    const [operation, setOperation] = useState<Operation>("add");
    const [operands, setOperands] = useState<OperandField[]>(createInitialOperands);
    const nextIdRef = useRef(MIN_OPERANDS);
    // The field that should receive focus on mount: the first one initially, later the one just added.
    const [focusId, setFocusId] = useState(0);

    const canRemove = operands.length > MIN_OPERANDS;

    function updateOperand(id: number, value: string): void {
        setOperands((previous) =>
            previous.map((operand) => (operand.id === id ? { id, value, error: undefined } : operand)),
        );
    }

    function addOperand(): void {
        const id = nextIdRef.current++;
        setOperands((previous) => [...previous, { id, value: "" }]);
        setFocusId(id);
    }

    function removeOperand(id: number): void {
        setOperands((previous) => (previous.length > MIN_OPERANDS ? previous.filter((o) => o.id !== id) : previous));
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const parsed = operands.map((operand) => parseOperand(operand.value));

        if (parsed.some((result) => !result.ok)) {
            setOperands((previous) =>
                previous.map((operand, index) => {
                    const result = parsed[index];
                    return result && !result.ok ? { ...operand, error: result.error } : { ...operand, error: undefined };
                }),
            );
            return;
        }

        const numbers = parsed.flatMap((result) => (result.ok ? [result.value] : []));
        onSubmit({ operation, numbers });
    }

    return (
        <form className={styles["form"]} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <fieldset className={styles["operands"]} disabled={isSubmitting}>
                <legend className={styles["legend"]}>Zahlen</legend>
                <ol className={styles["operandList"]}>
                    {operands.map((operand, index) => {
                        const position = index + 1;
                        return (
                            <li key={operand.id} className={styles["operandRow"]}>
                                <NumberField
                                    label={operandLabel(position)}
                                    value={operand.value}
                                    onChange={(value) => updateOperand(operand.id, value)}
                                    error={operand.error}
                                    autoFocus={operand.id === focusId}
                                />
                                {canRemove && (
                                    <Button
                                        variant="ghost"
                                        className={styles["removeButton"]}
                                        aria-label={removeOperandLabel(position)}
                                        onClick={() => removeOperand(operand.id)}
                                    >
                                        Entfernen
                                    </Button>
                                )}
                            </li>
                        );
                    })}
                </ol>
                <Button variant="ghost" onClick={addOperand}>
                    {ADD_OPERAND_LABEL}
                </Button>
            </fieldset>

            <OperationSelect value={operation} onChange={setOperation} disabled={isSubmitting} />

            <Button type="submit" isLoading={isSubmitting} loadingText="Berechne…">
                Berechnen
            </Button>
        </form>
    );
}
