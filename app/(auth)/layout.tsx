import type { Metadata } from "next";
import type { ReactNode } from "react";

// Tela de entrada: não deve aparecer nos resultados de busca
export const metadata: Metadata = {
  title: "Entrar · Stella",
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
