import { AxiosError, AxiosHeaders } from "axios";
import { vi } from "vitest";

export const BASE_URL_TESTE = "http://api.test";

/** Substitui o cliente axios por funções simuladas, mantendo `comImagem` real. */
export async function mockModuloApi(importOriginal: <T>() => Promise<T>) {
  const original = await importOriginal<typeof import("../services/api")>();
  return {
    ...original,
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      defaults: { baseURL: BASE_URL_TESTE },
    },
  };
}

/** Simula um erro HTTP do axios com o corpo `{ sucesso: false, erro }` da nossa API. */
export function erroDaApi(status: number, erro: string) {
  const headers = new AxiosHeaders();
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", { headers }, null, {
    status, statusText: "", headers: {}, config: { headers }, data: { sucesso: false, erro },
  });
}

export function resposta<T>(dados: T) {
  return { data: { sucesso: true, dados } };
}

export const CONFIRMADO = { isConfirmed: true, isDenied: false, isDismissed: false };
export const CANCELADO = { isConfirmed: false, isDenied: false, isDismissed: true };
