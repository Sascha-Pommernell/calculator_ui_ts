import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense, useState } from "react";
import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/errors/index.ts";
import { createQueryClient } from "@/lib/react-query.ts";

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [queryClient] = useState(createQueryClient);

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <Suspense fallback={<p className="app-loading">Lädt…</p>}>{children}</Suspense>
                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
