import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <AppShell><Suspense fallback={<main className="h-full flex items-center justify-center text-stone-600" role="status">Carregando...</main>}>{children}</Suspense></AppShell>;
}