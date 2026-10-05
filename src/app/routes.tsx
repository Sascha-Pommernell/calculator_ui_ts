import type { RouteObject } from "react-router";
import { paths } from "@/config/paths.ts";
import { RootErrorBoundary, RootLayout } from "./routes/root.tsx";

/** Route tree; exported separately so tests can mount it with a memory router. */
export const routes: RouteObject[] = [
    {
        path: paths.home.path,
        element: <RootLayout />,
        errorElement: <RootErrorBoundary />,
        hydrateFallbackElement: <p className="app-loading">Lädt…</p>,
        children: [
            {
                index: true,
                lazy: () => import("./routes/calculator.tsx"),
            },
            {
                path: "*",
                lazy: () => import("./routes/not-found.tsx"),
            },
        ],
    },
];
