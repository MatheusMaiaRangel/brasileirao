import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

// Monta o corpo de um POST/PUT: se houver arquivo, envia como multipart
// (FormData) com a imagem no campo "imagem"; senão devolve o próprio objeto (JSON).
export function comImagem(dados, arquivo) {
  if (!arquivo) return dados;

  const formData = new FormData();
  Object.entries(dados).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null) formData.append(chave, valor);
  });
  formData.append("imagem", arquivo);
  return formData;
}

export default api;