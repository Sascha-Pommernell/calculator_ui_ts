import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    isLoading?: boolean;
    loadingText?: string;
}

export function Button({
    variant = "primary",
    isLoading = false,
    loadingText,
    disabled,
    className,
    children,
    type = "button",
    ...rest
}: ButtonProps) {
    const classes = [styles["button"], styles[variant], className].filter(Boolean).join(" ");

    return (
        <button type={type} className={classes} disabled={disabled || isLoading} aria-busy={isLoading} {...rest}>
            {isLoading && loadingText ? loadingText : children}
        </button>
    );
}
