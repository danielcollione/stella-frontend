"use client";

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  // Círculo branco com a ilustração ampliada: o arquivo tem muita margem branca e, sem recorte, o desenho fica minúsculo
  framed?: boolean;
}

export function Logo({ size = 'md', showText = false, className = '', framed = false }: LogoProps) {
  const sizes = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
  };

  const { width, height } = sizes[size];

  if (framed) {
    return (
      <Link href="/" aria-label="Stella" className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
        <span className="block h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-full border border-stone-200/80 bg-white shadow-sm transition-transform hover:scale-105">
          <Image src="/logo.jpg" alt="Stella Logo" width={128} height={128} className="h-full w-full object-cover scale-[1.55]" priority />
        </span>
        {showText && (
          <span className="font-serif italic text-2xl font-semibold tracking-tight text-stone-900">stella</span>
        )}
      </Link>
    );
  }

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      <Image
        src="/logo.jpg"
        alt="Stella Logo"
        width={width}
        height={height}
        className="object-cover rounded-full transition-transform hover:scale-105"
        priority
      />
      {showText && (
        <span className="font-serif italic text-2xl font-semibold tracking-tight text-stone-900">
          stella
        </span>
      )}
    </Link>
  );
}