import { MentionThumb, mentionToken, splitByMentions } from "@/components/features/mentions/MentionInput";
import type { ClothingItem } from "@/types/wardrobe";

// Texto da mensagem com cada "@Nome da peça" destacado
export function MentionedText({ content, items }: { content: string; items?: ClothingItem[] }) {
  return (
    <>
      {splitByMentions(content, items ?? []).map((part, index) => part.mention
        ? <span key={index} className="rounded-md bg-white/15 px-1 font-medium">{part.text}</span>
        : part.text)}
    </>
  );
}

// Miniaturas das peças mencionadas, acima do balão da mensagem do usuário
export function MentionedItems({ items }: { items: ClothingItem[] }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {items.map((item) => (
        <span key={item.id} className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-stone-200 bg-white py-0.5 pl-0.5 pr-2.5 text-xs text-stone-600 shadow-2xs">
          <MentionThumb item={item} className="h-6 w-6" />
          <span className="truncate">{mentionToken(item).slice(1)}</span>
        </span>
      ))}
    </div>
  );
}
