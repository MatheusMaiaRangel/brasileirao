import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

export const URL_PREVIEW = "blob:preview";

beforeEach(() => {
  // Os componentes registram erros da API no console; nos testes isso só polui a saída.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  // jsdom não implementa createObjectURL (usado no preview das imagens).
  URL.createObjectURL = vi.fn(() => URL_PREVIEW);
});

afterEach(() => {
  cleanup();
});
