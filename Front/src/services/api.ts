import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim() ||
    (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin),
});

// Monta o corpo de um POST/PUT: se houver arquivo, envia como multipart
// (FormData) com a imagem no campo "imagem" (e a foto do estádio, se houver, em
// "imagemEstadio"); senão devolve o próprio objeto (JSON).
export function comImagem(
  dados: Record<string, string | number | undefined>,
  arquivo: File | null,
  arquivoEstadio: File | null = null,
): FormData | typeof dados {
  if (!arquivo && !arquivoEstadio) return dados;

  const formData = new FormData();
  Object.entries(dados).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null) formData.append(chave, String(valor));
  });
  if (arquivo) formData.append("imagem", arquivo);
  if (arquivoEstadio) formData.append("imagemEstadio", arquivoEstadio);
  return formData;
}

export default api;
