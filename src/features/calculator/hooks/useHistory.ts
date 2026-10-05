import { useCallback, useRef, useState } from "react";
import type { CalculationResult } from "../types/index.ts";

export interface HistoryEntry extends CalculationResult {
    id: number;
}

export interface UseHistoryResult {
    entries: readonly HistoryEntry[];
    add: (result: CalculationResult) => void;
    clear: () => void;
}

export function useHistory(limit: number): UseHistoryResult {
    const [entries, setEntries] = useState<readonly HistoryEntry[]>([]);
    const nextIdRef = useRef(0);

    const add = useCallback(
        (result: CalculationResult) => {
            const id = nextIdRef.current++;
            setEntries((previous) => [{ ...result, id }, ...previous].slice(0, limit));
        },
        [limit],
    );

    const clear = useCallback(() => setEntries([]), []);

    return { entries, add, clear };
}
