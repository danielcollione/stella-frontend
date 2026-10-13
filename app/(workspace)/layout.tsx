import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

// Área logada: fora dos resultados de busca
export const metadata: Metadata = {
  title: "Stella",
  robots: { index: false, follow: false },
};

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <AppShell><Suspense fallback={<main className="h-full flex items-center justify-center text-stone-600" role="status">Carregando...</main>}>{children}</Suspense></AppShell>;
}