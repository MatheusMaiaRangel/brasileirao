import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../services/api";
import { CANCELADO, CONFIRMADO, erroDaApi, resposta } from "../test/utils";
import type { Jogador, Time } from "../types";
import TimeDetalhes from "./TimeDetalhes";

vi.mock("../services/api", async (importOriginal) =>
  (await import("../test/utils")).mockModuloApi(importOriginal));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
// A seção do técnico tem testes próprios; aqui ela só precisa existir.
vi.mock("./TecnicoSecao", () => ({ default: () => <div>Seção do técnico</div> }));

const apiMock = vi.mocked(api);
const swalMock = vi.mocked(Swal);

const GREMIO: Time = {
  _id: "t1", nome: "Grêmio", estadio: "Arena do Grêmio", anoFundacao: 1903,
  imagem: "/uploads/gremio.png", imagemEstadio: "/uploads/arena.png",
};
const INTER: Time = { _id: "t2", nome: "Internacional", estadio: "Beira-Rio", anoFundacao: 1909 };
const SUAREZ: Jogador = { _id: "j1", nome: "Suárez", idade: 37, posicao: "Atacante", numeroCamisa: 9, timeId: "t1", imagem: "/uploads/suarez.png" };
const GEROMEL: Jogador = { _id: "j2", nome: "Geromel", idade: 38, posicao: "Zagueiro", numeroCamisa: 3, timeId: "t1" };

function mockGets(jogadores: Jogador[] | Error = [SUAREZ, GEROMEL]) {
  apiMock.get.mockImplementation(async (url: string) => {
    if (url === "/times") return resposta([GREMIO, INTER]);
    if (jogadores instanceof Error) throw jogadores;
    return resposta(jogadores);
  });
}

function renderizar(time: Time = GREMIO) {
  const usuario = userEvent.setup();
  const onVoltar = vi.fn();
  render(<TimeDetalhes time={time} onVoltar={onVoltar} />);
  return { usuario, onVoltar };
}

function modal() {
  return screen.getByText("Editar Jogador").closest(".player-edit-modal") as HTMLElement;
}

describe("<TimeDetalhes />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGets();
  });

  describe("informações e elenco", () => {
    it("mostra os dados do clube, escudo e foto do estádio", async () => {
      renderizar();
      expect(screen.getByRole("heading", { name: "Grêmio" })).toBeInTheDocument();
      expect(screen.getByAltText("Escudo do Grêmio")).toHaveAttribute("src", "http://api.test/uploads/gremio.png");
      expect(screen.getByAltText("Estádio Arena do Grêmio")).toHaveAttribute("src", "http://api.test/uploads/arena.png");
      expect(screen.getByText("Seção do técnico")).toBeInTheDocument();
      await screen.findByText("Suárez");
    });

    it("mostra as iniciais quando o clube não tem escudo", async () => {
      renderizar(INTER);
      expect(screen.getByLabelText("Sem imagem do clube")).toHaveTextContent("IN");
      expect(screen.queryByAltText(/Estádio/)).not.toBeInTheDocument();
      await screen.findByText("Suárez");
    });

    it("carrega o elenco do clube com número, posição e idade", async () => {
      renderizar();
      expect(screen.getByText("Carregando jogadores...")).toBeInTheDocument();
      expect(await screen.findByText("Suárez")).toBeInTheDocument();
      expect(screen.getByText("Atacante · 37 anos")).toBeInTheDocument();
      expect(screen.getByText("09")).toBeInTheDocument();
      expect(screen.getByText("jogadores")).toBeInTheDocument();
      expect(apiMock.get).toHaveBeenCalledWith("/times/t1/jogadores");
    });

    it("mostra mensagem de elenco vazio", async () => {
      mockGets([]);
      renderizar();
      expect(await screen.findByText(/Nenhum jogador cadastrado neste clube/)).toBeInTheDocument();
    });

    it("usa 'jogador' no singular", async () => {
      mockGets([GEROMEL]);
      renderizar();
      await screen.findByText("Geromel");
      expect(screen.getByText("jogador")).toBeInTheDocument();
    });

    it("mostra erro quando não consegue carregar o elenco", async () => {
      mockGets(new Error("offline"));
      renderizar();
      expect(await screen.findByText("Erro ao carregar jogadores")).toHaveClass("feedback", "error");
    });

    it("chama onVoltar", async () => {
      const { usuario, onVoltar } = renderizar();
      await usuario.click(screen.getByRole("button", { name: /Voltar aos clubes/ }));
      expect(onVoltar).toHaveBeenCalled();
    });
  });

  describe("cadastro de jogador", () => {
    async function preencher(usuario: ReturnType<typeof userEvent.setup>) {
      const form = screen.getByRole("button", { name: /Adicionar/ }).closest("form") as HTMLElement;
      await usuario.type(within(form).getByPlaceholderText("Nome"), "Arthur");
      await usuario.type(within(form).getByPlaceholderText("Idade"), "29");
      await usuario.type(within(form).getByPlaceholderText("Posição"), "Volante");
      await usuario.type(within(form).getByPlaceholderText("Nº"), "8");
      return form;
    }

    it("envia JSON com o timeId do clube e mostra sucesso", async () => {
      apiMock.post.mockResolvedValue({ data: { sucesso: true } });
      const { usuario } = renderizar();
      await screen.findByText("Suárez");

      await preencher(usuario);
      await usuario.click(screen.getByRole("button", { name: /Adicionar/ }));

      expect(apiMock.post).toHaveBeenCalledWith("/jogadores", {
        nome: "Arthur", idade: "29", posicao: "Volante", numeroCamisa: "8", timeId: "t1",
      });
      expect(await screen.findByText("Jogador adicionado com sucesso.")).toHaveClass("success");
    });

    it("envia FormData quando há foto", async () => {
      apiMock.post.mockResolvedValue({ data: { sucesso: true } });
      const { usuario } = renderizar();
      await screen.findByText("Suárez");

      const form = await preencher(usuario);
      await usuario.upload(within(form).getByLabelText("Foto (opcional)"), new File(["x"], "arthur.png", { type: "image/png" }));
      expect(within(form).getByText("arthur.png")).toBeInTheDocument();
      await usuario.click(screen.getByRole("button", { name: /Adicionar/ }));

      expect((apiMock.post.mock.calls[0][1] as FormData).get("timeId")).toBe("t1");
    });

    it.each([
      [erroDaApi(400, "A idade deve ser um inteiro positivo"), "A idade deve ser um inteiro positivo"],
      [new Error("rede"), "Erro ao cadastrar jogador"],
    ])("mostra o erro do cadastro (%#)", async (erro, mensagem) => {
      apiMock.post.mockRejectedValue(erro);
      const { usuario } = renderizar();
      await screen.findByText("Suárez");

      await preencher(usuario);
      await usuario.click(screen.getByRole("button", { name: /Adicionar/ }));

      expect(await screen.findByText(mensagem)).toHaveClass("error");
    });
  });

  describe("edição e transferência", () => {
    it("edita os dados com PUT sem transferir", async () => {
      apiMock.put.mockResolvedValue({ data: { sucesso: true } });
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Editar jogador"))[0]);

      const nome = within(modal()).getByPlaceholderText("Nome");
      expect(nome).toHaveValue("Suárez");
      expect(within(modal()).getByAltText("Foto do jogador")).toHaveAttribute("src", "http://api.test/uploads/suarez.png");
      await usuario.clear(nome);
      await usuario.type(nome, "Luis Suárez");
      await usuario.click(within(modal()).getByRole("button", { name: "Salvar" }));

      expect(apiMock.put).toHaveBeenCalledWith("/jogadores/j1", {
        nome: "Luis Suárez", idade: "37", posicao: "Atacante", numeroCamisa: "9",
      });
      expect(apiMock.patch).not.toHaveBeenCalled();
      expect(await screen.findByText("Jogador atualizado com sucesso.")).toBeInTheDocument();
      expect(screen.queryByText("Editar Jogador")).not.toBeInTheDocument();
    });

    it("transfere com PATCH quando o clube muda", async () => {
      apiMock.put.mockResolvedValue({ data: { sucesso: true } });
      apiMock.patch.mockResolvedValue({ data: { sucesso: true } });
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Editar jogador"))[1]);

      await usuario.selectOptions(within(modal()).getByRole("combobox"), "Internacional");
      await usuario.click(within(modal()).getByRole("button", { name: "Salvar" }));

      await waitFor(() => expect(apiMock.patch).toHaveBeenCalledWith("/jogadores/j2", { timeId: "t2" }));
      expect(await screen.findByText("Jogador atualizado com sucesso.")).toBeInTheDocument();
    });

    it("avisa quando os dados salvam mas a transferência falha", async () => {
      apiMock.put.mockResolvedValue({ data: { sucesso: true } });
      apiMock.patch.mockRejectedValue(erroDaApi(404, "Time não encontrado"));
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Editar jogador"))[0]);

      await usuario.selectOptions(within(modal()).getByRole("combobox"), "t2");
      await usuario.click(within(modal()).getByRole("button", { name: "Salvar" }));

      expect(await screen.findByText("Dados atualizados, mas a transferência falhou: Time não encontrado")).toHaveClass("error");
      expect(screen.queryByText("Editar Jogador")).not.toBeInTheDocument();
    });

    it("usa mensagem padrão quando a transferência falha sem resposta da API", async () => {
      apiMock.put.mockResolvedValue({ data: { sucesso: true } });
      apiMock.patch.mockRejectedValue(new Error("rede"));
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Editar jogador"))[0]);

      await usuario.selectOptions(within(modal()).getByRole("combobox"), "t2");
      await usuario.click(within(modal()).getByRole("button", { name: "Salvar" }));

      expect(await screen.findByText(/a transferência falhou: Erro ao transferir jogador/)).toBeInTheDocument();
    });

    it("troca a foto com preview e envia FormData", async () => {
      vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:jogador") }));
      apiMock.put.mockResolvedValue({ data: { sucesso: true } });
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Editar jogador"))[1]);

      expect(within(modal()).queryByAltText("Foto do jogador")).not.toBeInTheDocument();
      await usuario.upload(within(modal()).getByLabelText("Trocar foto (opcional)"), new File(["x"], "nova.png", { type: "image/png" }));
      expect(within(modal()).getByAltText("Foto do jogador")).toHaveAttribute("src", "blob:jogador");
      await usuario.click(within(modal()).getByRole("button", { name: "Salvar" }));

      expect(apiMock.put.mock.calls[0][1]).toBeInstanceOf(FormData);
      vi.unstubAllGlobals();
    });

    it.each([
      [erroDaApi(400, 'O campo "nome" deve conter texto'), 'O campo "nome" deve conter texto'],
      [new Error("rede"), "Erro ao atualizar jogador"],
    ])("mostra erro da edição e mantém o modal (%#)", async (erro, mensagem) => {
      apiMock.put.mockRejectedValue(erro);
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Editar jogador"))[0]);
      await usuario.click(within(modal()).getByRole("button", { name: "Salvar" }));

      expect(await screen.findByText(mensagem)).toHaveClass("error");
      expect(screen.getByText("Editar Jogador")).toBeInTheDocument();
    });

    it("fecha o modal em Cancelar e no X", async () => {
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Editar jogador"))[0]);
      await usuario.click(within(modal()).getByRole("button", { name: "Cancelar" }));
      expect(screen.queryByText("Editar Jogador")).not.toBeInTheDocument();

      await usuario.click(screen.getAllByTitle("Editar jogador")[0]);
      await usuario.click(within(modal()).getByRole("button", { name: "Fechar" }));
      expect(screen.queryByText("Editar Jogador")).not.toBeInTheDocument();
    });
  });

  describe("exclusão", () => {
    it("exclui após confirmação", async () => {
      swalMock.fire.mockResolvedValue(CONFIRMADO);
      apiMock.delete.mockResolvedValue({ data: null });
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Remover jogador"))[1]);

      await waitFor(() => expect(apiMock.delete).toHaveBeenCalledWith("/jogadores/j2"));
      expect(await screen.findByText("Jogador removido com sucesso.")).toBeInTheDocument();
    });

    it("não exclui quando cancelado", async () => {
      swalMock.fire.mockResolvedValue(CANCELADO);
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Remover jogador"))[0]);

      await waitFor(() => expect(swalMock.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Excluir jogador?" })));
      expect(apiMock.delete).not.toHaveBeenCalled();
    });

    it.each([
      [erroDaApi(404, "Jogador não encontrado"), "Jogador não encontrado"],
      [new Error("rede"), "Erro ao remover jogador"],
    ])("mostra erro ao excluir (%#)", async (erro, mensagem) => {
      swalMock.fire.mockResolvedValue(CONFIRMADO);
      apiMock.delete.mockRejectedValue(erro);
      const { usuario } = renderizar();
      await usuario.click((await screen.findAllByTitle("Remover jogador"))[0]);

      expect(await screen.findByText(mensagem)).toHaveClass("error");
    });

    it("ignora jogador sem id", async () => {
      mockGets([{ ...GEROMEL, _id: undefined }]);
      const { usuario } = renderizar();
      await usuario.click(await screen.findByTitle("Remover jogador"));
      expect(swalMock.fire).not.toHaveBeenCalled();
    });
  });
});
