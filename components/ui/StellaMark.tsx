import Image from "next/image";

interface StellaMarkProps {
  size: number;
  className?: string;
  // Decorativo quando há texto "Stella" ao lado; sozinho, precisa de nome acessível
  decorative?: boolean;
}

/**
 * O traço da Stella (a ilustração do logo, recortada e sem fundo) para uso como ícone.
 * Em tamanhos pequenos usa a versão de traço mais grosso, que continua legível.
 */
export function StellaMark({ size, className = "", decorative = false }: StellaMarkProps) {
  return (
    <Image
      src={size <= 32 ? "/stella-mark-sm.png" : "/stella-mark.png"}
      alt={decorative ? "" : "Stella"}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      draggable={false}
      className={`shrink-0 select-none ${className}`}
    />
  );
}
