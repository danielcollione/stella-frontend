// Recomprime fotos no navegador antes do upload, MANTENDO largura e altura: só a compressão muda, para o arquivo
// ficar mais leve (uma foto de celular de 5–10 MB costuma cair para 1,5–4 MB). Também converte HEIC do iPhone para
// JPEG e aplica a rotação da câmera, de modo que o back-end receba a foto já em pé (caminho mais leve dele).
// JPEG porque é o formato que todo navegador gera e que o back-end (ImageIO) sempre consegue ler.

const JPEG_QUALITY = 0.85;
// Limite de área do canvas no Safari do iOS (~16,7 MP). Só fotos maiores (ex: modo 48 MP do iPhone Pro) são
// reduzidas, e apenas o suficiente para caber; abaixo disso, as dimensões são preservadas.
const MAX_CANVAS_PIXELS = 16_000_000;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    // imageOrientation "from-image" aplica a rotação EXIF da câmera
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback (ex: HEIC no Safari): <img> também respeita a orientação EXIF por padrão
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      await image.decode();
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function jpegName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "foto";
  return `${base}.jpg`;
}

/**
 * Devolve a foto em JPEG mais leve, nas mesmas dimensões, já na orientação certa e sem metadados (EXIF/GPS).
 * Se o navegador não conseguir decodificar o arquivo, devolve o original (o back-end valida e responde com clareza).
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) return file;
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    return file;
  }

  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) return file;

  // Fundo branco: PNG com transparência não vira preto no JPEG
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  canvas.width = 0; // libera a memória do canvas imediatamente (importante em celulares)
  canvas.height = 0;
  if (!blob) return file;
  return new File([blob], jpegName(file.name), { type: "image/jpeg", lastModified: Date.now() });
}
