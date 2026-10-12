import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from "lucide-react";
import type { LucideProps } from "lucide-react";

// A condição vem em texto do back-end (WeatherCodes); a ordem importa: "pancadas de neve" antes de "chuva"
const ICONS: readonly [RegExp, typeof Sun][] = [
  [/tempestade/, CloudLightning],
  [/neve/, CloudSnow],
  [/garoa/, CloudDrizzle],
  [/chuva/, CloudRain],
  [/neblina/, CloudFog],
  [/parcialmente|predomínio/, CloudSun],
  [/nublado/, Cloud],
  [/limpo/, Sun],
];

export function WeatherIcon({ condition, ...props }: { condition: string | null | undefined } & LucideProps) {
  const Icon = ICONS.find(([pattern]) => pattern.test(condition ?? ""))?.[1] ?? CloudSun;
  return <Icon aria-hidden="true" strokeWidth={1.5} {...props} />;
}
