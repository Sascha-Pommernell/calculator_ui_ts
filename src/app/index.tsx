import { AppProvider } from "./provider.tsx";
import { AppRouter } from "./router.tsx";

export function App() {
    return (
        <AppProvider>
            <AppRouter />
        </AppProvider>
    );
}
