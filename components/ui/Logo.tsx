"use client";

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
  const sizes = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
  };

  const { width, height } = sizes[size];

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