import { SecureImage } from "@/components/ui/SecureImage";
import type { UserResponseDto } from "@/types/auth";

export function initialsOf(name: string | undefined): string {
  return name?.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

/**
 * A bolinha da pessoa: a foto de perfil (a do Google ou a enviada no Perfil) ou, sem foto, as iniciais. O tamanho
 * e a letra vêm de `className` (ex: "h-8 w-8 text-xs").
 */
export function UserAvatar({ user, className = "" }: { user: Pick<UserResponseDto, "name" | "avatarUrl"> | null; className?: string }) {
  const initials = (
    <span className={`flex shrink-0 items-center justify-center rounded-full border border-stone-300 bg-stone-200 font-semibold text-stone-700 ${className}`}>
      {initialsOf(user?.name)}
    </span>
  );
  if (!user?.avatarUrl) return initials;
  return <SecureImage src={user.avatarUrl} alt="" className={`block shrink-0 rounded-full object-cover ${className}`} fallback={initials} />;
}
