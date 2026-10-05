import { env } from "@/config/env.ts";
import { getErrorMessage } from "@/lib/api-client.ts";
import { useCalculate } from "../api/calculate.ts";
import { useHistory } from "../hooks/useHistory.ts";
import { CalculatorForm } from "./CalculatorForm.tsx";
import { HistoryList } from "./HistoryList.tsx";
import { ResultPanel } from "./ResultPanel.tsx";
import type { ResultPanelProps } from "./ResultPanel.tsx";

export function Calculator() {
    const { entries, add: addToHistory, clear: clearHistory } = useHistory(env.HISTORY_LIMIT);
    const calculation = useCalculate({ onSuccess: addToHistory });

    const resultProps: ResultPanelProps =
        calculation.status === "success"
            ? { status: "success", data: calculation.data }
            : calculation.status === "error"
              ? { status: "error", message: getErrorMessage(calculation.error) }
              : { status: calculation.status };

    return (
        <>
            <CalculatorForm onSubmit={(input) => calculation.mutate(input)} isSubmitting={calculation.isPending} />
            <ResultPanel {...resultProps} />
            <HistoryList entries={entries} onClear={clearHistory} />
        </>
    );
}
