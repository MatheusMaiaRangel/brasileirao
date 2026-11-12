import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Os componentes registram erros da API no console; nos testes isso só polui a saída.
vi.spyOn(console, "error").mockImplementation(() => undefined);
