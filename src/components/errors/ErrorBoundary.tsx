import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { MainErrorFallback } from "./MainErrorFallback.tsx";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    override state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    override componentDidCatch(error: Error, info: ErrorInfo): void {
        if (this.props.onError) {
            this.props.onError(error, info);
            return;
        }
        console.error("Unhandled UI error", error, info.componentStack);
    }

    override render(): ReactNode {
        if (this.state.hasError) return this.props.fallback ?? <MainErrorFallback />;
        return this.props.children;
    }
}
