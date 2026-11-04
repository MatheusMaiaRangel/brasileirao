export function getTimeId(time: { id?: string; _id?: string } | null | undefined): string | null {
  return time?.id ?? time?._id ?? null;
}

export function getTimeImageUrl(time: { imagem?: string | null } | null | undefined, baseUrl = ""): string {
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
