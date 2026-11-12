export function inteiroPositivo(valor: unknown): boolean {
  const texto = String(valor);
  const numero = Number(texto);
  return /^\d+$/.test(texto) && Number.isSafeInteger(numero) && numero > 0;
}

export function textoPreenchido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim() !== '';
}

export function anoFundacaoValido(valor: unknown, anoAtual = new Date().getFullYear()): boolean {
  if ((typeof valor !== 'string' && typeof valor !== 'number') || String(valor).trim() === '') return false;
  const ano = Number(valor);
  return Number.isSafeInteger(ano) && ano > 0 && ano <= anoAtual;
}
