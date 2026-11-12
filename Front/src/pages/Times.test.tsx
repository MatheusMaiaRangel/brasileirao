import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../services/api";
import { CANCELADO, CONFIRMADO, erroDaApi } from "../test/utils";
import type { Time } from "../types";
import Times from "./Times";

vi.mock("../services/api", async (importOriginal) =>
  (await import("../test/utils")).mockModuloApi(importOriginal));

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const apiMock = vi.mocked(api);
const swalMock = vi.mocked(Swal);

const GREMIO: Time = { _id: "t1", nome: "Grêmio", estadio: "Arena", anoFundacao: 1903, imagem: "/uploads/gremio.png" };
const INTER: Time = { _id: "t2", nome: "Internacional", estadio: "Beira-Rio", anoFundacao: 1909 };

function respostaLista(times: Time[]) {
  return { data: { sucesso: true, dados: times } };
}

function renderizar(onSelecionarTime = vi.fn()) {
  const usuario = userEvent.setup();
  render(<Times onSelecionarTime={onSelecionarTime} />);
  return { usuario, onSelecionarTime };
}

describe("<Times />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue(respostaLista([GREMIO, INTER]));
  });

  describe("listagem (GET /times)", () => {
    it("mostra os clubes vindos da API e o contador", async () => {
      renderizar();

      expect(await screen.findByText("Grêmio")).toBeInTheDocument();
      expect(screen.getByText("Internacional")).toBeInTheDocument();
      expect(screen.getByText("02")).toBeInTheDocument();
      expect(screen.getByText("clubes registrados")).toBeInTheDocument();
      expect(apiMock.get).toHaveBeenCalledWith("/times");
    });

    it("monta a URL do escudo com a baseURL da API", async () => {
      renderizar();
      const escudo = await screen.findByAltText("Escudo do Grêmio");
      expect(escudo).toHaveAttribute("src", "http://api.test/uploads/gremio.png");
    });

    it("usa o singular quando há um único clube", async () => {
      apiMock.get.mockResolvedValue(respostaLista([INTER]));
      renderizar();
      expect(await screen.findByText("clube registrado")).toBeInTheDocument();
    });

    it("mostra mensagem de lista vazia", async () => {
      apiMock.get.mockResolvedValue(respostaLista([]));
      renderizar();
      expect(await screen.findByText(/Nenhum clube cadastrado ainda/)).toBeInTheDocument();
    });

    it("mostra erro quando a API falha", async () => {
      apiMock.get.mockRejectedValue(new Error("offline"));
      renderizar();
      expect(await screen.findByText("Erro ao carregar times")).toHaveClass("feedback", "error");
    });

    it("abre os detalhes ao clicar no card", async () => {
      const { usuario, onSelecionarTime } = renderizar();
      await usuario.click(await screen.findByText("Grêmio"));
      expect(onSelecionarTime).toHaveBeenCalledWith(GREMIO);
    });
  });

  describe("cadastro (POST /times)", () => {
    async function preencherFormulario(usuario: ReturnType<typeof userEvent.setup>) {
      await usuario.type(screen.getByPlaceholderText("Nome do clube"), "Santos");
      await usuario.type(screen.getByPlaceholderText("Estádio"), "Vila Belmiro");
      await usuario.type(screen.getByPlaceholderText("Fundação"), "1912");
    }

    it("envia JSON, recarrega a lista e mostra sucesso", async () => {
      apiMock.post.mockResolvedValue({ data: { sucesso: true } });
      const { usuario } = renderizar();
      await screen.findByText("Grêmio");

      await preencherFormulario(usuario);
      await usuario.click(screen.getByRole("button", { name: /Adicionar/ }));

      expect(apiMock.post).toHaveBeenCalledWith("/times", { nome: "Santos", estadio: "Vila Belmiro", anoFundacao: "1912" });
      expect(await screen.findByText("Time adicionado com sucesso.")).toHaveClass("success");
      expect(apiMock.get).toHaveBeenCalledTimes(2);
      expect(screen.getByPlaceholderText("Nome do clube")).toHaveValue("");
    });

    it("envia multipart (FormData) quando há escudo", async () => {
      apiMock.post.mockResolvedValue({ data: { sucesso: true } });
      const { usuario } = renderizar();
      await screen.findByText("Grêmio");

      await preencherFormulario(usuario);
      const escudo = new File(["png"], "santos.png", { type: "image/png" });
      await usuario.upload(screen.getByLabelText("Escudo (opcional)"), escudo);
      expect(screen.getByText("santos.png")).toBeInTheDocument();
      await usuario.click(screen.getByRole("button", { name: /Adicionar/ }));

      const corpo = apiMock.post.mock.calls[0][1] as FormData;
      expect(corpo).toBeInstanceOf(FormData);
      expect((corpo.get("imagem") as File).name).toBe("santos.png");
    });

    it("mostra a mensagem de erro devolvida pela API (400)", async () => {
      apiMock.post.mockRejectedValue(erroDaApi(400, "Ano de fundação deve ser um ano válido"));
      const { usuario } = renderizar();
      await screen.findByText("Grêmio");

      await preencherFormulario(usuario);
      await usuario.click(screen.getByRole("button", { name: /Adicionar/ }));

      expect(await screen.findByText("Ano de fundação deve ser um ano válido")).toHaveClass("error");
    });
  });

  describe("edição (PUT /times/:id)", () => {
    it("abre o modal com os dados, salva e fecha", async () => {
      apiMock.put.mockResolvedValue({ data: { sucesso: true } });
      const { usuario, onSelecionarTime } = renderizar();
      await screen.findByText("Grêmio");

      await usuario.click(screen.getAllByTitle("Editar clube")[0]);
      expect(onSelecionarTime).not.toHaveBeenCalled();
      const modal = screen.getByText("Editar Clube").closest(".modal") as HTMLElement;
      const nome = within(modal).getByPlaceholderText("Nome do clube");
      expect(nome).toHaveValue("Grêmio");

      await usuario.clear(nome);
      await usuario.type(nome, "Grêmio FBPA");
      await usuario.click(within(modal).getByRole("button", { name: "Salvar" }));

      expect(apiMock.put).toHaveBeenCalledWith("/times/t1", { nome: "Grêmio FBPA", estadio: "Arena", anoFundacao: 1903 });
      expect(await screen.findByText("Time atualizado com sucesso.")).toBeInTheDocument();
      expect(screen.queryByText("Editar Clube")).not.toBeInTheDocument();
    });

    it("mostra preview do novo escudo e envia FormData", async () => {
      apiMock.put.mockResolvedValue({ data: { sucesso: true } });
      const { usuario } = renderizar();
      await screen.findByText("Grêmio");

      await usuario.click(screen.getAllByTitle("Editar clube")[0]);
      const modal = screen.getByText("Editar Clube").closest(".modal") as HTMLElement;
      expect(within(modal).getByAltText("Escudo do clube")).toHaveAttribute("src", "http://api.test/uploads/gremio.png");

      await usuario.upload(within(modal).getByLabelText("Trocar escudo"), new File(["x"], "novo.png", { type: "image/png" }));
      expect(within(modal).getByAltText("Escudo do clube")).toHaveAttribute("src", "blob:preview");
      await usuario.click(within(modal).getByRole("button", { name: "Salvar" }));

      expect(apiMock.put.mock.calls[0][1]).toBeInstanceOf(FormData);
    });

    it("fecha o modal sem salvar em Cancelar e no X", async () => {
      const { usuario } = renderizar();
      await screen.findByText("Grêmio");

      await usuario.click(screen.getAllByTitle("Editar clube")[0]);
      await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(screen.queryByText("Editar Clube")).not.toBeInTheDocument();

      await usuario.click(screen.getAllByTitle("Editar clube")[0]);
      await usuario.click(screen.getByRole("button", { name: "Fechar" }));
      expect(screen.queryByText("Editar Clube")).not.toBeInTheDocument();
      expect(apiMock.put).not.toHaveBeenCalled();
    });

    it("mostra erro da API e mantém o modal aberto", async () => {
      apiMock.put.mockRejectedValue(erroDaApi(400, 'O campo "nome" deve conter texto'));
      const { usuario } = renderizar();
      await screen.findByText("Grêmio");

      await usuario.click(screen.getAllByTitle("Editar clube")[0]);
      await usuario.click(screen.getByRole("button", { name: "Salvar" }));

      expect(await screen.findByText('O campo "nome" deve conter texto')).toBeInTheDocument();
      expect(screen.getByText("Editar Clube")).toBeInTheDocument();
    });
  });

  describe("exclusão (DELETE /times/:id)", () => {
    it("pede confirmação e exclui", async () => {
      swalMock.fire.mockResolvedValue(CONFIRMADO);
      apiMock.delete.mockResolvedValue({ data: null });
      const { usuario, onSelecionarTime } = renderizar();
      await screen.findByText("Grêmio");

      await usuario.click(screen.getAllByTitle("Remover clube")[1]);

      expect(swalMock.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Excluir clube?" }));
      await waitFor(() => expect(apiMock.delete).toHaveBeenCalledWith("/times/t2"));
      expect(await screen.findByText("Time removido com sucesso.")).toBeInTheDocument();
      expect(onSelecionarTime).not.toHaveBeenCalled();
    });

    it("não exclui quando o usuário cancela", async () => {
      swalMock.fire.mockResolvedValue(CANCELADO);
      const { usuario } = renderizar();
      await screen.findByText("Grêmio");

      await usuario.click(screen.getAllByTitle("Remover clube")[0]);

      await waitFor(() => expect(swalMock.fire).toHaveBeenCalled());
      expect(apiMock.delete).not.toHaveBeenCalled();
    });

    it("mostra o erro 409 quando o clube tem jogadores", async () => {
      swalMock.fire.mockResolvedValue(CONFIRMADO);
      apiMock.delete.mockRejectedValue(
        erroDaApi(409, "Não é possível deletar o time porque existem jogadores vinculados a ele"),
      );
      const { usuario } = renderizar();
      await screen.findByText("Grêmio");

      await usuario.click(screen.getAllByTitle("Remover clube")[0]);

      expect(await screen.findByText(/existem jogadores vinculados/)).toHaveClass("error");
    });

    it("avisa quando o clube não tem id", async () => {
      apiMock.get.mockResolvedValue(respostaLista([{ nome: "Sem Id", estadio: "X", anoFundacao: 2000 }]));
      const { usuario } = renderizar();
      await screen.findByText("Sem Id");

      await usuario.click(screen.getByTitle("Remover clube"));

      expect(await screen.findByText("ID do time não encontrado")).toBeInTheDocument();
      expect(swalMock.fire).not.toHaveBeenCalled();
    });
  });
});
