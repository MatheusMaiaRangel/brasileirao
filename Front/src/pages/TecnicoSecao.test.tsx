import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../services/api";
import { CANCELADO, CONFIRMADO, erroDaApi, resposta } from "../test/utils";
import type { Tecnico } from "../types";
import TecnicoSecao from "./TecnicoSecao";

vi.mock("../services/api", async (importOriginal) =>
  (await import("../test/utils")).mockModuloApi(importOriginal));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const apiMock = vi.mocked(api);
const swalMock = vi.mocked(Swal);
const TECNICO: Tecnico = { _id: "tec1", nome: "Renato Gaúcho", idade: 62, timeId: "t1", imagem: "/uploads/renato.png" };

function renderizar() {
  const usuario = userEvent.setup();
  const onMensagem = vi.fn();
  render(<TecnicoSecao timeId="t1" onMensagem={onMensagem} />);
  return { usuario, onMensagem };
}

function modal() {
  return screen.getByText("Editar Técnico").closest(".player-edit-modal") as HTMLElement;
}

describe("<TecnicoSecao />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("clube sem técnico", () => {
    beforeEach(() => {
      apiMock.get.mockResolvedValue(resposta(null));
    });

    it("mostra carregando e depois o formulário de cadastro", async () => {
      renderizar();
      expect(screen.getByText("Carregando técnico...")).toBeInTheDocument();
      expect(await screen.findByPlaceholderText("Nome do técnico")).toBeInTheDocument();
      expect(apiMock.get).toHaveBeenCalledWith("/times/t1/tecnico");
    });

    it("cadastra o técnico com foto (multipart) e recarrega", async () => {
      apiMock.post.mockResolvedValue({ data: { sucesso: true } });
      const { usuario, onMensagem } = renderizar();

      await usuario.type(await screen.findByPlaceholderText("Nome do técnico"), "Abel");
      await usuario.type(screen.getByPlaceholderText("Idade"), "47");
      await usuario.upload(screen.getByLabelText("Foto (opcional)"), new File(["x"], "abel.png", { type: "image/png" }));
      apiMock.get.mockResolvedValue(resposta({ ...TECNICO, nome: "Abel" }));
      await usuario.click(screen.getByRole("button", { name: /Adicionar técnico/ }));

      const corpo = apiMock.post.mock.calls[0][1] as FormData;
      expect(apiMock.post.mock.calls[0][0]).toBe("/tecnicos");
      expect(corpo.get("nome")).toBe("Abel");
      expect(corpo.get("idade")).toBe("47");
      expect(corpo.get("timeId")).toBe("t1");
      expect(onMensagem).toHaveBeenCalledWith("Técnico adicionado com sucesso.");
      expect(await screen.findByText("Abel")).toBeInTheDocument();
    });

    it("repassa o erro 409 da API", async () => {
      apiMock.post.mockRejectedValue(erroDaApi(409, "Este time já possui um técnico"));
      const { usuario, onMensagem } = renderizar();

      await usuario.type(await screen.findByPlaceholderText("Nome do técnico"), "Abel");
      await usuario.type(screen.getByPlaceholderText("Idade"), "47");
      await usuario.click(screen.getByRole("button", { name: /Adicionar técnico/ }));

      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("Este time já possui um técnico", "error"));
    });

    it("usa mensagem padrão quando o erro não vem da API", async () => {
      apiMock.post.mockRejectedValue(new Error("rede"));
      const { usuario, onMensagem } = renderizar();

      await usuario.type(await screen.findByPlaceholderText("Nome do técnico"), "Abel");
      await usuario.type(screen.getByPlaceholderText("Idade"), "47");
      await usuario.click(screen.getByRole("button", { name: /Adicionar técnico/ }));

      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("Erro ao cadastrar técnico", "error"));
    });
  });

  it("avisa quando não consegue carregar", async () => {
    apiMock.get.mockRejectedValue(new Error("offline"));
    const { onMensagem } = renderizar();
    await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("Erro ao carregar técnico", "error"));
  });

  describe("clube com técnico", () => {
    beforeEach(() => {
      apiMock.get.mockResolvedValue(resposta(TECNICO));
    });

    it("mostra nome, idade e foto", async () => {
      renderizar();
      expect(await screen.findByText("Renato Gaúcho")).toBeInTheDocument();
      expect(screen.getByText("Técnico · 62 anos")).toBeInTheDocument();
      expect(screen.getByAltText("Renato Gaúcho")).toHaveAttribute("src", "http://api.test/uploads/renato.png");
    });

    it("edita e salva com PUT", async () => {
      apiMock.put.mockResolvedValue({ data: { sucesso: true } });
      const { usuario, onMensagem } = renderizar();
      await usuario.click(await screen.findByTitle("Editar técnico"));

      const nome = within(modal()).getByPlaceholderText("Nome");
      expect(nome).toHaveValue("Renato Gaúcho");
      await usuario.clear(nome);
      await usuario.type(nome, "Renato Portaluppi");
      await usuario.click(within(modal()).getByRole("button", { name: "Salvar" }));

      expect(apiMock.put).toHaveBeenCalledWith("/tecnicos/tec1", { nome: "Renato Portaluppi", idade: "62" });
      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("Técnico atualizado com sucesso."));
      expect(screen.queryByText("Editar Técnico")).not.toBeInTheDocument();
    });

    it("troca a foto na edição com preview", async () => {
      apiMock.put.mockResolvedValue({ data: { sucesso: true } });
      const { usuario } = renderizar();
      await usuario.click(await screen.findByTitle("Editar técnico"));

      await usuario.upload(within(modal()).getByLabelText("Trocar foto (opcional)"), new File(["x"], "nova.png", { type: "image/png" }));
      expect(within(modal()).getByAltText("Foto do técnico")).toHaveAttribute("src", "blob:preview");
      await usuario.click(within(modal()).getByRole("button", { name: "Salvar" }));

      expect(apiMock.put.mock.calls[0][1]).toBeInstanceOf(FormData);
    });

    it("mostra erro da edição e mantém o modal", async () => {
      apiMock.put.mockRejectedValue(erroDaApi(400, "A idade deve ser um inteiro positivo"));
      const { usuario, onMensagem } = renderizar();
      await usuario.click(await screen.findByTitle("Editar técnico"));
      await usuario.click(within(modal()).getByRole("button", { name: "Salvar" }));

      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("A idade deve ser um inteiro positivo", "error"));
      expect(screen.getByText("Editar Técnico")).toBeInTheDocument();
    });

    it("fecha o modal em Cancelar e no X", async () => {
      const { usuario } = renderizar();
      await usuario.click(await screen.findByTitle("Editar técnico"));
      await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(screen.queryByText("Editar Técnico")).not.toBeInTheDocument();

      await usuario.click(screen.getByTitle("Editar técnico"));
      await usuario.click(screen.getByRole("button", { name: "Fechar" }));
      expect(screen.queryByText("Editar Técnico")).not.toBeInTheDocument();
    });

    it("exclui após confirmação", async () => {
      swalMock.fire.mockResolvedValue(CONFIRMADO);
      apiMock.delete.mockResolvedValue({ data: null });
      const { usuario, onMensagem } = renderizar();
      await usuario.click(await screen.findByTitle("Remover técnico"));

      await waitFor(() => expect(apiMock.delete).toHaveBeenCalledWith("/tecnicos/tec1"));
      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("Técnico removido com sucesso."));
    });

    it("não exclui quando cancelado", async () => {
      swalMock.fire.mockResolvedValue(CANCELADO);
      const { usuario } = renderizar();
      await usuario.click(await screen.findByTitle("Remover técnico"));

      await waitFor(() => expect(swalMock.fire).toHaveBeenCalled());
      expect(apiMock.delete).not.toHaveBeenCalled();
    });

    it("repassa erro ao excluir", async () => {
      swalMock.fire.mockResolvedValue(CONFIRMADO);
      apiMock.delete.mockRejectedValue(erroDaApi(404, "Técnico não encontrado"));
      const { usuario, onMensagem } = renderizar();
      await usuario.click(await screen.findByTitle("Remover técnico"));

      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("Técnico não encontrado", "error"));
    });
  });
});
