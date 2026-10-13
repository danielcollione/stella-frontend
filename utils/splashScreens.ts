// Telas de abertura do aplicativo instalado no iPhone e no iPad. O iOS só mostra a imagem cujo tamanho bate
// exatamente com o aparelho, então há uma por tamanho de tela (largura × altura em pontos, e a densidade).
// No Android a tela de abertura é montada sozinha a partir do manifesto (ícone, nome e cor de fundo).
const DEVICES: readonly [width: number, height: number, ratio: number][] = [
  [320, 568, 2], // iPhone SE (1ª geração)
  [375, 667, 2], // iPhone SE (2ª e 3ª), 8
  [414, 736, 3], // iPhone 8 Plus
  [375, 812, 3], // iPhone X, XS, 11 Pro, 12 mini, 13 mini
  [414, 896, 2], // iPhone XR, 11
  [414, 896, 3], // iPhone XS Max, 11 Pro Max
  [390, 844, 3], // iPhone 12, 13, 14
  [428, 926, 3], // iPhone 12 e 13 Pro Max, 14 Plus
  [393, 852, 3], // iPhone 14 Pro, 15, 15 Pro, 16
  [430, 932, 3], // iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  [402, 874, 3], // iPhone 16 Pro
  [440, 956, 3], // iPhone 16 Pro Max
  [768, 1024, 2], // iPad 9,7" e mini
  [810, 1080, 2], // iPad 10,2"
  [820, 1180, 2], // iPad 10,9" e Air
  [834, 1194, 2], // iPad Pro 11"
  [1024, 1366, 2], // iPad Pro 12,9"
];

export const SPLASH_SCREENS = DEVICES.map(([width, height, ratio]) => ({
  url: `/splash/splash-${width * ratio}x${height * ratio}.png`,
  media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
}));
