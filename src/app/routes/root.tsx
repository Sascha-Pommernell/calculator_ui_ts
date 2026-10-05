import { Outlet, isRouteErrorResponse, useRouteError } from "react-router";
import { MainLayout } from "@/components/layouts/index.ts";
import { Alert } from "@/components/ui/alert/index.ts";
import { ApiStatus } from "@/features/calculator/index.ts";

const APP_TITLE = "Calculator";

export function RootLayout() {
    return (
        <MainLayout title={APP_TITLE} headerAside={<ApiStatus />}>
            <Outlet />
        </MainLayout>
    );
}

export function RootErrorBoundary() {
    const error = useRouteError();
    const message = isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : "Es ist ein unerwarteter Fehler aufgetreten.";

    return (
        <MainLayout title={APP_TITLE}>
            <Alert>{message}</Alert>
        </MainLayout>
    );
}
