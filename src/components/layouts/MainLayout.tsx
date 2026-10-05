import type { ReactNode } from "react";
import styles from "./MainLayout.module.css";

export interface MainLayoutProps {
    title: string;
    /** Rendered at the right-hand side of the header (e.g. status indicators). */
    headerAside?: ReactNode;
    children: ReactNode;
}

export function MainLayout({ title, headerAside, children }: MainLayoutProps) {
    return (
        <div className={styles["layout"]}>
            <header className={styles["header"]}>
                <h1 className={styles["title"]}>{title}</h1>
                {headerAside}
            </header>
            <main className={styles["main"]}>{children}</main>
        </div>
    );
}
