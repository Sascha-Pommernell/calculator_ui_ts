import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/config/env.ts";
import { server } from "../mocks/server.ts";
import { renderApp } from "../utils/render.tsx";

describe("App", () => {
    it("renders the calculator on the home route with a live API status", async () => {
        renderApp("/");

        expect(await screen.findByRole("heading", { level: 1, name: "Calculator" })).toBeInTheDocument();
        expect(await screen.findByRole("button", { name: "Berechnen" })).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("API erreichbar"));
    });

    it("reports when the API is offline", async () => {
        server.use(http.get(`${env.API_URL}/health`, () => HttpResponse.error()));

        renderApp("/");

        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("API nicht erreichbar"));
    });

    it("renders a not-found page for unknown routes", async () => {
        renderApp("/does-not-exist");

        expect(await screen.findByRole("heading", { level: 2, name: "Seite nicht gefunden" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Zurück zum Rechner" })).toHaveAttribute("href", "/");
    });
});
