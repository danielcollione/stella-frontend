"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useModalPortalContainer } from "@/components/ui/Modal";

interface SelectProps<Value extends string> {
  id: string;
  value: Value;
  onValueChange: (value: Value) => void;
  options: readonly { value: Value; label: string }[];
  disabled?: boolean;
  size?: "default" | "compact";
  "aria-label"?: string;
}

const TRIGGER_SIZES = {
  default: "h-12 rounded-lg px-4 text-sm",
  compact: "h-9 rounded-full px-3.5 text-xs",
} as const;

export function Select<Value extends string>({ id, value, onValueChange, options, disabled, size = "default", "aria-label": ariaLabel }: SelectProps<Value>) {
  // Dentro de um Modal, a lista abre dentro do <dialog>; fora dele, no <body> como antes
  const portalContainer = useModalPortalContainer();
  return (
    <SelectPrimitive.Root value={value} onValueChange={(selected) => {
      const option = options.find((item) => item.value === selected);
      if (option) onValueChange(option.value);
    }} disabled={disabled}>
      <SelectPrimitive.Trigger id={id} aria-label={ariaLabel} className={`group flex ${TRIGGER_SIZES[size]} w-full min-w-0 items-center justify-between gap-3 border border-stone-200/90 bg-white text-left font-medium text-stone-700 shadow-[0_1px_2px_rgba(28,25,23,0.03)] outline-none transition-[border-color,box-shadow] hover:border-stone-300 focus-visible:border-stone-400 focus-visible:ring-2 focus-visible:ring-stone-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] data-[state=open]:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-none [&>span:first-child]:truncate`}>
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon asChild>
          <ChevronDown aria-hidden="true" size={16} className="shrink-0 text-stone-400 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={portalContainer ?? undefined}>
        <SelectPrimitive.Content position="popper" sideOffset={6} collisionPadding={12} className="stella-select-menu z-[70] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-24px)] max-h-[var(--radix-select-content-available-height)] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-[0_12px_32px_rgba(28,25,23,0.08),0_2px_8px_rgba(28,25,23,0.04)]">
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value} value={option.value} className="relative flex min-h-10 cursor-pointer select-none items-center rounded-md py-2.5 pl-3 pr-10 text-sm text-stone-600 outline-none transition-colors data-[highlighted]:bg-stone-100 data-[highlighted]:text-stone-900 data-[state=checked]:bg-stone-50 data-[state=checked]:font-medium data-[state=checked]:text-stone-900">
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center justify-center text-stone-700"><Check size={15} strokeWidth={1.75} /></SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}