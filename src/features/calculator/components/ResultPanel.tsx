import { Alert } from "@/components/ui/alert/index.ts";
import type { CalculationResult } from "../types/index.ts";
import { formatExpression } from "../utils/format.ts";
import styles from "./ResultPanel.module.css";

export type ResultPanelProps =
    | { status: "idle" | "pending" }
    | { status: "success"; data: CalculationResult }
    | { status: "error"; message: string };

export function ResultPanel(props: ResultPanelProps) {
    return (
        <section className={styles["panel"]} aria-live="polite" aria-atomic="true" aria-label="Ergebnis">
            {props.status === "idle" && (
                <p className={styles["hint"]}>Gib zwei Zahlen ein und wähle eine Operation.</p>
            )}

            {props.status === "pending" && <p className={styles["hint"]}>Berechnung läuft…</p>}

            {props.status === "success" && (
                <>
                    <p className={styles["expression"]}>{formatExpression(props.data)} =</p>
                    <output className={styles["value"]} data-testid="result-value">
                        {props.data.result}
                    </output>
                </>
            )}

            {props.status === "error" && <Alert>{props.message}</Alert>}
        </section>
    );
}
