import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import styles from "./NumberField.module.css";

export interface NumberFieldProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "id"> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string | undefined;
}

/**
 * Text input tuned for numeric entry. Deliberately not `type="number"`: that control
 * silently drops invalid input and behaves inconsistently across browsers/locales.
 */
export function NumberField({ label, value, onChange, error, ...rest }: NumberFieldProps) {
    const inputId = useId();
    const errorId = useId();

    return (
        <div className={styles["field"]}>
            <label htmlFor={inputId} className={styles["label"]}>
                {label}
            </label>
            <input
                id={inputId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                className={styles["input"]}
                value={value}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => onChange(event.target.value)}
                {...rest}
            />
            {error && (
                <p id={errorId} className={styles["error"]} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
