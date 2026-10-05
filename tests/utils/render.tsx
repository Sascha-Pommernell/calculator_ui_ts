import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { routes } from "@/app/routes.tsx";
import { queryConfig } from "@/lib/react-query.ts";

export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            ...queryConfig,
            queries: { ...queryConfig.queries, retry: false, refetchInterval: false },
        },
    });
}

interface ProviderRenderResult extends RenderResult {
    user: UserEvent;
    queryClient: QueryClient;
}

/** Renders a component inside the same providers the app uses (minus routing). */
export function renderWithProviders(
    ui: ReactElement,
    options: Omit<RenderOptions, "wrapper"> = {},
): ProviderRenderResult {
    const queryClient = createTestQueryClient();
    const user = userEvent.setup();

    function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    return { ...render(ui, { wrapper: Wrapper, ...options }), user, queryClient };
}

/** Renders the full application route tree at the given path. */
export function renderApp(route = "/"): ProviderRenderResult {
    const router = createMemoryRouter(routes, { initialEntries: [route] });
    return renderWithProviders(<RouterProvider router={router} />);
}
