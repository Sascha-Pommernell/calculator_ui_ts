import { screen, waitFor, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/config/env.ts";
import { Calculator } from "@/features/calculator/index.ts";
import { DIVISION_BY_ZERO_ERROR } from "../../../mocks/handlers.ts";
import { server } from "../../../mocks/server.ts";
import { renderWithProviders } from "../../../utils/render.tsx";

const operandField = (position: number) => screen.getByLabelText(`Zahl ${position}`);

async function fillOperands(user: UserEvent, values: string[]) {
    for (const [index, value] of values.entries()) {
        const field = operandField(index + 1);
        await user.clear(field);
        if (value !== "") await user.type(field, value);
    }
}

async function fillAndSubmit(user: UserEvent, values: string[], operationLabel?: string) {
    await fillOperands(user, values);
    if (operationLabel) await user.click(screen.getByRole("radio", { name: operationLabel }));
    await user.click(screen.getByRole("button", { name: "Berechnen" }));
}

const resultRegion = () => screen.getByRole("region", { name: "Ergebnis" });
const addOperandButton = () => screen.getByRole("button", { name: "Zahl hinzufügen" });

describe("Calculator", () => {
    it("starts with exactly two operand fields and no remove buttons", () => {
        renderWithProviders(<Calculator />);

        expect(screen.getAllByRole("textbox")).toHaveLength(2);
        expect(operandField(1)).toHaveFocus();
        expect(screen.queryByRole("button", { name: /entfernen$/ })).not.toBeInTheDocument();
    });

    it("sends the chosen operation and renders the exact result", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, ["1", "3"], "Dividieren");

        expect(await within(resultRegion()).findByTestId("result-value")).toHaveTextContent(
            "0.3333333333333333333333333333",
        );
        expect(within(resultRegion()).getByText("1 ÷ 3 =")).toBeInTheDocument();
    });

    it("adds operand fields and calculates with all of them (variadic)", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await user.click(addOperandButton());
        await user.click(addOperandButton());
        expect(screen.getAllByRole("textbox")).toHaveLength(4);
        expect(operandField(4)).toHaveFocus();

        await fillAndSubmit(user, ["1", "2", "3", "4"]);

        expect(await within(resultRegion()).findByTestId("result-value")).toHaveTextContent("10");
        expect(within(resultRegion()).getByText("1 + 2 + 3 + 4 =")).toBeInTheDocument();
    });

    it("removes an operand field but never below two", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await user.click(addOperandButton());
        await fillOperands(user, ["10", "4", "3"]);
        expect(screen.getAllByRole("button", { name: /entfernen$/ })).toHaveLength(3);

        await user.click(screen.getByRole("button", { name: "Zahl 2 entfernen" }));

        expect(screen.getAllByRole("textbox")).toHaveLength(2);
        expect(operandField(1)).toHaveValue("10");
        expect(operandField(2)).toHaveValue("3");
        expect(screen.queryByRole("button", { name: /entfernen$/ })).not.toBeInTheDocument();
    });

    it("accepts a comma as decimal separator", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, ["1,5", "2"]);

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

        await fillAndSubmit(user, ["abc", " "]);

        const alerts = screen.getAllByRole("alert");
        expect(alerts.map((element) => element.textContent)).toEqual(["Ungültige Zahl", "Bitte eine Zahl eingeben"]);
        expect(operandField(1)).toHaveAttribute("aria-invalid", "true");
        expect(requests).toBe(0);
    });

    it("validates every operand, including added ones", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await user.click(addOperandButton());
        await fillAndSubmit(user, ["1", "2", "x"]);

        expect(screen.getByRole("alert")).toHaveTextContent("Ungültige Zahl");
        expect(operandField(3)).toHaveAttribute("aria-invalid", "true");
        expect(operandField(1)).not.toHaveAttribute("aria-invalid");
    });

    it("clears a field error once the user edits the field", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, ["abc", "1"]);
        expect(screen.getByRole("alert")).toHaveTextContent("Ungültige Zahl");

        await user.type(operandField(1), "1");
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the API error message", async () => {
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, ["1", "0"], "Dividieren");

        expect(await screen.findByRole("alert")).toHaveTextContent(DIVISION_BY_ZERO_ERROR);
    });

    it("shows a network error message", async () => {
        server.use(http.post(`${env.API_URL}/api/calculate/:operation`, () => HttpResponse.error()));
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, ["1", "2"]);

        expect(await screen.findByRole("alert")).toHaveTextContent("Die API ist nicht erreichbar");
    });

    it("disables the form while a calculation is pending", async () => {
        server.use(
            http.post(`${env.API_URL}/api/calculate/:operation`, async () => {
                await delay(200);
                return HttpResponse.text('{"operation":"add","numbers":[1,2],"result":3}', {
                    headers: { "Content-Type": "application/json" },
                });
            }),
        );
        const { user } = renderWithProviders(<Calculator />);

        await fillAndSubmit(user, ["1", "2"]);

        expect(screen.getByRole("button", { name: "Berechne…" })).toBeDisabled();
        expect(operandField(1)).toBeDisabled();
        expect(addOperandButton()).toBeDisabled();

        expect(await screen.findByRole("button", { name: "Berechnen" })).toBeEnabled();
        expect(screen.getByTestId("result-value")).toHaveTextContent("3");
    });

    it("records successful calculations in the history, newest first", async () => {
        const { user } = renderWithProviders(<Calculator />);

        expect(screen.queryByRole("heading", { name: "Verlauf" })).not.toBeInTheDocument();

        await fillAndSubmit(user, ["1", "2"]);
        await within(resultRegion()).findByTestId("result-value");

        await fillAndSubmit(user, ["10", "20"]);
        await waitFor(() => expect(screen.getByTestId("result-value")).toHaveTextContent("30"));

        const history = screen.getByRole("region", { name: "Verlauf" });
        const items = within(within(history).getByRole("list")).getAllByRole("listitem");
        expect(items.map((item) => item.textContent)).toEqual(["10 + 20 =30", "1 + 2 =3"]);

        await user.click(screen.getByRole("button", { name: "Leeren" }));
        expect(screen.queryByRole("heading", { name: "Verlauf" })).not.toBeInTheDocument();
    });
});
