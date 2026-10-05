import { Button } from "@/components/ui/button/index.ts";
import type { HistoryEntry } from "../hooks/useHistory.ts";
import { formatExpression } from "../utils/format.ts";
import styles from "./HistoryList.module.css";

interface HistoryListProps {
    entries: readonly HistoryEntry[];
    onClear: () => void;
}

export function HistoryList({ entries, onClear }: HistoryListProps) {
    if (entries.length === 0) return null;

    return (
        <section aria-labelledby="history-heading">
            <div className={styles["header"]}>
                <h2 id="history-heading" className={styles["heading"]}>
                    Verlauf
                </h2>
                <Button variant="ghost" onClick={onClear}>
                    Leeren
                </Button>
            </div>
            <ol className={styles["list"]}>
                {entries.map((entry) => (
                    <li key={entry.id} className={styles["item"]}>
                        <span className={styles["expression"]}>{formatExpression(entry)} =</span>
                        <span className={styles["result"]}>{entry.result}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
