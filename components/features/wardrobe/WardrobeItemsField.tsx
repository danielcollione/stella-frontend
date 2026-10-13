"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { MentionThumb } from "@/components/features/mentions/MentionInput";
import { WardrobePickerDialog } from "@/components/features/wardrobe/WardrobePickerDialog";
import { displayName } from "@/services/wardrobe/wardrobeCatalog";
import type { ClothingItem } from "@/types/wardrobe";

interface WardrobeItemsFieldProps {
  id?: string;
  value: ClothingItem[];
  onChange: (items: ClothingItem[]) => void;
  max: number;
  disabled?: boolean;
  dialogTitle: string;
  dialogDescription?: string;
}

/** Campo de formulário com as peças escolhidas e o botão que abre a grade do guarda-roupa para escolher. */
export function WardrobeItemsField({ id, value, onChange, max, disabled, dialogTitle, dialogDescription }: WardrobeItemsFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <ul className="flex flex-wrap gap-1.5">
        {value.map((item) => (
          <li key={item.id} className="inline-flex max-w-full items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-1.5 text-xs text-stone-700">
            <MentionThumb item={item} className="h-7 w-7" />
            <span className="truncate">{displayName(item)}</span>
            <button type="button" onClick={() => onChange(value.filter((chosen) => chosen.id !== item.id))} disabled={disabled} aria-label={`Remover ${displayName(item)}`} className="rounded-full p-0.5 text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-700 disabled:opacity-50">
              <X size={13} />
            </button>
          </li>
        ))}
        <li>
          <button id={id} type="button" onClick={() => setOpen(true)} disabled={disabled} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-stone-300 bg-white/60 px-3.5 py-2 text-xs font-medium text-stone-600 transition-colors hover:border-stone-500 hover:text-stone-900 disabled:opacity-50">
            <Plus size={13} />
            {value.length > 0 ? "Alterar peças" : "Escolher peças"}
          </button>
        </li>
      </ul>
      {open && (
        <WardrobePickerDialog
          title={dialogTitle}
          description={dialogDescription}
          initial={value}
          max={max}
          confirmLabel="Concluir"
          onClose={() => setOpen(false)}
          onConfirm={(items) => {
            setOpen(false);
            onChange(items);
          }}
        />
      )}
    </div>
  );
}
