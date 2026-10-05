import { useMemo } from "react";
import { RouterProvider, createBrowserRouter } from "react-router";
import { routes } from "./routes.tsx";

export function AppRouter() {
    const router = useMemo(() => createBrowserRouter(routes), []);
    return <RouterProvider router={router} />;
}