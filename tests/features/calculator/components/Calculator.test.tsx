import { screen, waitFor, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/config/env.ts";
import { Calculator } from "@/features/calculator/index.ts";
import { DIVISION_BY_ZERO_ERROR } from "../../../mocks/handlers.ts";
import { server } from "../../../mocks/server.ts";
import { renderWithProviders } from "../../../utils/render.tsx";

async function fillAndSubmit(user: UserEvent, a: string, b: string, operationLabel?: string) {
    await user.clear(screen.getByLabelText("Zahl a"));
    await user.type(screen.getByLabelText("Zahl a"), a);
    await user.clear(screen.getByLabelText("Zahl b"));
    await user.type(screen.getByLabelText("Zahl b"), b);
    if (operationLabel) await user.click(screen.getByRole("radio", { name: operationLabel }));
    await user.click(screen.getByRole("button", { name: "Berechnen" }));
}

const resultRegion = () => screen.getByRole("region", { name: "Ergebnis" });

describe("Calculator", () => {
    it("sends the chosen operation and renders the exact result", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, "1", "3", "Dividieren");

        expect(await within(resultRegion()).findByTestId("result-value")).toHaveTextContent(
            "0.3333333333333333333333333333",
        );
        expect(within(resultRegion()).getByText("1 ÷ 3 =")).toBeInTheDocument();
    });

    it("accepts a comma as decimal separator", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, "1,5", "2");

        expect(await within(resultRegion()).findByTestId("result-value")).toHaveTextContent("3.5");
    });

    it("validates operands client-side and does not call the API", async () => {
        let requests = 0;
        server.use(
            http.post(`${env.API_URL}/api/calculate/:operation`, () => {
                requests++;
                return HttpResponse.json({ error: "should not be called" }, { status: 500 });
            }),
        );
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, "abc", " ");

        const alerts = screen.getAllByRole("alert");
        expect(alerts.map((element) => element.textContent)).toEqual(["Ungültige Zahl", "Bitte eine Zahl eingeben"]);
        expect(screen.getByLabelText("Zahl a")).toHaveAttribute("aria-invalid", "true");
        expect(requests).toBe(0);
    });

    it("clears a field error once the user edits the field", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, "abc", "1");
        expect(screen.getByRole("alert")).toHaveTextContent("Ungültige Zahl");

        await user.type(screen.getByLabelText("Zahl a"), "1");
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the API error message", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, "1", "0", "Dividieren");

        expect(await screen.findByRole("alert")).toHaveTextContent(DIVISION_BY_ZERO_ERROR);
    });

    it("shows a network error message", async () => {
        server.use(http.post(`${env.API_URL}/api/calculate/:operation`, () => HttpResponse.error()));
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, "1", "2");

        expect(await screen.findByRole("alert")).toHaveTextContent("Die API ist nicht erreichbar");
    });

    it("disables the form while a calculation is pending", async () => {
        server.use(
            http.post(`${env.API_URL}/api/calculate/:operation`, async () => {
                await delay(200);
                return HttpResponse.text('{"operation":"add","a":1,"b":2,"result":3}', {
                    headers: { "Content-Type": "application/json" },
                });
            }),
        );
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, "1", "2");

        expect(screen.getByRole("button", { name: "Berechne…" })).toBeDisabled();
        expect(screen.getByLabelText("Zahl a")).toBeDisabled();

        expect(await screen.findByRole("button", { name: "Berechnen" })).toBeEnabled();
        expect(screen.getByTestId("result-value")).toHaveTextContent("3");
    });

    it("records successful calculations in the history, newest first", async () => {
        const { user } = renderWithProviders(<Calculator />);

        expect(screen.queryByRole("heading", { name: "Verlauf" })).not.toBeInTheDocument();

        await fillAndSubmit(user, "1", "2");
        await within(resultRegion()).findByTestId("result-value");

        await fillAndSubmit(user, "10", "20");
        await waitFor(() => expect(screen.getByTestId("result-value")).toHaveTextContent("30"));

        const items = within(screen.getByRole("list")).getAllByRole("listitem");
        expect(items.map((item) => item.textContent)).toEqual(["10 + 20 =30", "1 + 2 =3"]);

        await user.click(screen.getByRole("button", { name: "Leeren" }));
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
});
