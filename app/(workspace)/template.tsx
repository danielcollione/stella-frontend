import { ViewTransition } from "react";

export default function WorkspaceTemplate({ children }: { children: React.ReactNode }) {
  return <ViewTransition enter="stella-page" exit="stella-page" default="none">{children}</ViewTransition>;
}