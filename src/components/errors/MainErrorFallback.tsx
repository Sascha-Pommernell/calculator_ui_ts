import { Alert } from "@/components/ui/alert/index.ts";
import { Button } from "@/components/ui/button/index.ts";
import styles from "./MainErrorFallback.module.css";

export function MainErrorFallback() {
    return (
        <main className={styles["container"]}>
            <Alert>Es ist ein unerwarteter Fehler aufgetreten.</Alert>
            <Button variant="ghost" onClick={() => window.location.assign(window.location.origin)}>
                Seite neu laden
            </Button>
        </main>
    );
}
