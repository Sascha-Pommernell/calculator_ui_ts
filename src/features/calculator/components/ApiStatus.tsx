import { useApiHealth } from "../api/get-health.ts";
import type { HealthStatus } from "../api/get-health.ts";
import styles from "./ApiStatus.module.css";

const LABELS: Readonly<Record<HealthStatus, string>> = {
    checking: "API wird geprüft…",
    online: "API erreichbar",
    offline: "API nicht erreichbar",
};

export function ApiStatus() {
    const status = useApiHealth();

    return (
        <p className={styles["status"]} role="status" data-status={status}>
            <span className={styles["dot"]} aria-hidden="true" />
            {LABELS[status]}
        </p>
    );
}
