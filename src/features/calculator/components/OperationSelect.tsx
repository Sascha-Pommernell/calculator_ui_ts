import { useId } from "react";
import { OPERATIONS, OPERATION_META } from "../types/index.ts";
import type { Operation } from "../types/index.ts";
import styles from "./OperationSelect.module.css";

interface OperationSelectProps {
    value: Operation;
    onChange: (operation: Operation) => void;
    disabled?: boolean | undefined;
}

export function OperationSelect({ value, onChange, disabled }: OperationSelectProps) {
    const groupId = useId();

    return (
        <fieldset className={styles["group"]} disabled={disabled} aria-labelledby={groupId}>
            <legend id={groupId} className={styles["legend"]}>
                Operation
            </legend>
            {OPERATIONS.map((operation) => {
                const { label, symbol } = OPERATION_META[operation];
                return (
                    <label key={operation} className={styles["option"]}>
                        <input
                            type="radio"
                            name="operation"
                            value={operation}
                            checked={value === operation}
                            onChange={() => onChange(operation)}
                            className={styles["input"]}
                        />
                        <span className={styles["symbol"]} aria-hidden="true">
                            {symbol}
                        </span>
                        <span>{label}</span>
                    </label>
                );
            })}
        </fieldset>
    );
}
