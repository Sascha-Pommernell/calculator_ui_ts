import { Link } from "react-router";
import { paths } from "@/config/paths.ts";

export function Component() {
    return (
        <section>
            <h2>Seite nicht gefunden</h2>
            <p>
                <Link to={paths.home.getHref()}>Zurück zum Rechner</Link>
            </p>
        </section>
    );
}
