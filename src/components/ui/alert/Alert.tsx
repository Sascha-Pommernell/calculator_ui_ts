import type { ReactNode } from "react";
import styles from "./Alert.module.css";

export interface AlertProps {
    children: ReactNode;
    className?: string | undefined;
}

export function Alert({ children, className }: AlertProps) {
    const classes = [styles["alert"], className].filter(Boolean).join(" ");
    return (
        <p role="alert" className={classes}>
            {children}
        </p>
    );
}
