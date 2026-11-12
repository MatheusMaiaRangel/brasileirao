import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import api from "./services/api";
import { resposta } from "./test/utils";

vi.mock("./services/api", async (importOriginal) =>
  (await import("./test/utils")).mockModuloApi(importOriginal));

const apiMock = vi.mocked(api);

describe("<App />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockImplementation(async (url: string) => {
      if (url === "/times") return resposta([{ _id: "t1", nome: "Grêmio", estadio: "Arena", anoFundacao: 1903 }]);
      if (url === "/times/t1/tecnico") return resposta(null);
      return resposta([]);
    });
  });

  it("navega da lista de clubes para os detalhes e volta", async () => {
    const usuario = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Cadastro de Times" })).toBeInTheDocument();
    await usuario.click(await screen.findByText("Grêmio"));

    expect(await screen.findByRole("heading", { name: "Grêmio" })).toBeInTheDocument();
    expect(await screen.findByText(/Nenhum jogador cadastrado/)).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/times/t1/jogadores");
    expect(apiMock.get).toHaveBeenCalledWith("/times/t1/tecnico");

    await usuario.click(screen.getByRole("button", { name: /Voltar aos clubes/ }));
    expect(await screen.findByRole("heading", { name: "Cadastro de Times" })).toBeInTheDocument();
  });
});
