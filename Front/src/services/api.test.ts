import { describe, expect, it } from "vitest";
import api, { comImagem } from "./api";

describe("api", () => {
  it("usa o backend local em desenvolvimento quando VITE_API_URL não está definida", () => {
    expect(api.defaults.baseURL).toBe(import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000");
  });
});

describe("comImagem", () => {
  const dados = { nome: "Santos", anoFundacao: 1912, apelido: undefined };

  it("devolve o próprio objeto (JSON) quando não há arquivos", () => {
    expect(comImagem(dados, null)).toBe(dados);
    expect(comImagem(dados, null, null)).toBe(dados);
  });

  it("monta FormData com os campos e o escudo no campo 'imagem'", () => {
    const escudo = new File(["png"], "escudo.png", { type: "image/png" });
    const corpo = comImagem(dados, escudo);

    expect(corpo).toBeInstanceOf(FormData);
    const form = corpo as FormData;
    expect(form.get("nome")).toBe("Santos");
    expect(form.get("anoFundacao")).toBe("1912");
    expect(form.has("apelido")).toBe(false);
    expect((form.get("imagem") as File).name).toBe("escudo.png");
    expect(form.has("imagemEstadio")).toBe(false);
  });

  it("envia só a foto do estádio no campo 'imagemEstadio'", () => {
    const estadio = new File(["jpg"], "estadio.jpg", { type: "image/jpeg" });
    const form = comImagem(dados, null, estadio) as FormData;

    expect(form.has("imagem")).toBe(false);
    expect((form.get("imagemEstadio") as File).name).toBe("estadio.jpg");
  });
});
