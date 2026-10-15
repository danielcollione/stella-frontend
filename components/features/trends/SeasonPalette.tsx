/**
 * A paleta da estação: as cores que a Stella encontrou no material, das mais fortes para as menos, com o nome de
 * cada uma. Discreta de propósito: serve de referência para combinar e para comprar.
 */
export function SeasonPalette({ palette }: { palette: { name: string; hex: string }[] }) {
  if (palette.length === 0) return null;
  return (
    <figure>
      <figcaption className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Paleta da estação</figcaption>
      {/* No celular, as cores ficam maiores e num slide (com o nome inteiro); a partir do tablet, todas numa linha */}
      <ul className="scrollbar-none -mx-4 mt-3 flex snap-x scroll-px-4 gap-3.5 overflow-x-auto px-4 sm:mx-0 sm:scroll-px-0 sm:gap-2 sm:overflow-visible sm:px-0">
        {palette.map((color) => (
          <li key={color.hex} className="w-[104px] shrink-0 snap-start sm:w-auto sm:min-w-0 sm:flex-1 sm:shrink">
            <span aria-hidden="true" className="block h-16 rounded-2xl border border-stone-900/5 sm:h-14 sm:rounded-xl" style={{ backgroundColor: color.hex }} />
            <span className="mt-1.5 block text-[12px] leading-snug text-stone-600 sm:truncate sm:text-[11px] sm:leading-tight sm:text-stone-500" title={color.name}>{color.name}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
