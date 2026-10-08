import { PublicPageTransition } from "@/components/layout/PublicPageTransition";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <PublicPageTransition>{children}</PublicPageTransition>
  );
}