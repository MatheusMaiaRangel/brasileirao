export function inteiroPositivo(valor: unknown): boolean {
  const texto = String(valor);
  const numero = Number(texto);
  return /^\d+$/.test(texto) && Number.isSafeInteger(numero) && numero > 0;
}
