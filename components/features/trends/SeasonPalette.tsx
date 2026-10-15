/**
 * A paleta da estação: as cores que a Stella encontrou no material, das mais fortes para as menos, com o nome de
 * cada uma. Discreta de propósito: serve de referência para combinar e para comprar.
 */
export function SeasonPalette({ palette }: { palette: { name: string; hex: string }[] }) {
  if (palette.length === 0) return null;
  return (
    <figure>
      <figcaption className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Paleta da estação</figcaption>
      <ul className="mt-3 flex gap-2">
        {palette.map((color) => (
          <li key={color.hex} className="min-w-0 flex-1">
            <span aria-hidden="true" className="block h-12 rounded-xl border border-stone-900/5 sm:h-14" style={{ backgroundColor: color.hex }} />
            <span className="mt-1.5 block truncate text-[11px] leading-tight text-stone-500" title={color.name}>{color.name}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
