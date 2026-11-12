import { describe, expect, it } from "vitest";
import { getTimeId, getTimeImageUrl } from "./timeHelpers";

describe("getTimeId", () => {
  it("prefere id e cai para _id", () => {
    expect(getTimeId({ id: "a", _id: "b" })).toBe("a");
    expect(getTimeId({ _id: "b" })).toBe("b");
  });

  it("devolve null sem id ou sem objeto", () => {
    expect(getTimeId({})).toBeNull();
    expect(getTimeId(null)).toBeNull();
    expect(getTimeId(undefined)).toBeNull();
  });
});

describe("getTimeImageUrl", () => {
  it("devolve string vazia quando não há imagem", () => {
    expect(getTimeImageUrl(null)).toBe("");
    expect(getTimeImageUrl({ imagem: null })).toBe("");
    expect(getTimeImageUrl({ imagem: "" })).toBe("");
  });

  it("mantém URLs absolutas", () => {
    expect(getTimeImageUrl({ imagem: "https://cdn.test/a.png" }, "http://api")).toBe("https://cdn.test/a.png");
    expect(getTimeImageUrl({ imagem: "http://cdn.test/a.png" }, "http://api")).toBe("http://cdn.test/a.png");
  });

  it("devolve o caminho como está quando não há baseUrl", () => {
    expect(getTimeImageUrl({ imagem: "/uploads/a.png" })).toBe("/uploads/a.png");
  });

  it.each([
    ["http://api", "/uploads/a.png"],
    ["http://api/", "/uploads/a.png"],
    ["http://api", "uploads/a.png"],
    ["http://api/", "uploads/a.png"],
  ])("junta base %s com caminho %s sem barra duplicada", (base, caminho) => {
    expect(getTimeImageUrl({ imagem: caminho }, base)).toBe("http://api/uploads/a.png");
  });
});
