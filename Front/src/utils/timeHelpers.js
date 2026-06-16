export function getTimeId(time) {
  return time?.id ?? time?._id ?? null;
}

export function getTimeImageUrl(time, baseUrl = "") {
  const imagem = time?.imagem;
  if (!imagem || typeof imagem !== "string") return "";

  if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
    return imagem;
  }

  if (!baseUrl) return imagem;

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = imagem.startsWith("/") ? imagem : `/${imagem}`;
  return `${normalizedBase}${normalizedPath}`;
}