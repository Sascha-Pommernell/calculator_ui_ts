import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button/index.ts";
import { NumberField } from "@/components/ui/form/index.ts";
import type { CalculationInput, Operation } from "../types/index.ts";
import { parseOperand } from "../utils/operand.ts";
import styles from "./CalculatorForm.module.css";
import { OperationSelect } from "./OperationSelect.tsx";

interface CalculatorFormProps {
    onSubmit: (values: CalculationInput) => void;
    isSubmitting: boolean;
}

interface FieldErrors {
    a?: string;
    b?: string;
}

export function CalculatorForm({ onSubmit, isSubmitting }: CalculatorFormProps) {
    const [operation, setOperation] = useState<Operation>("add");
    const [a, setA] = useState("");
    const [b, setB] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const parsedA = parseOperand(a);
        const parsedB = parseOperand(b);

        if (!parsedA.ok || !parsedB.ok) {
            setErrors({
                a: parsedA.ok ? undefined : parsedA.error,
                b: parsedB.ok ? undefined : parsedB.error,
            });
            return;
        }

        setErrors({});
        onSubmit({ operation, a: parsedA.value, b: parsedB.value });
    }

    return (
        <form className={styles["form"]} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <div className={styles["operands"]}>
                <NumberField
                    label="Zahl a"
                    value={a}
                    onChange={(value) => {
                        setA(value);
                        if (errors.a) setErrors((previous) => ({ ...previous, a: undefined }));
                    }}
                    error={errors.a}
                    disabled={isSubmitting}
                    autoFocus
                />
                <NumberField
                    label="Zahl b"
                    value={b}
                    onChange={(value) => {
                        setB(value);
                        if (errors.b) setErrors((previous) => ({ ...previous, b: undefined }));
                    }}
                    error={errors.b}
                    disabled={isSubmitting}
                />
            </div>

            <OperationSelect value={operation} onChange={setOperation} disabled={isSubmitting} />

            <Button type="submit" isLoading={isSubmitting} loadingText="Berechne…">
                Berechnen
            </Button>
        </form>
    );
}
