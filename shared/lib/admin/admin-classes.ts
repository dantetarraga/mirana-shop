/**
 * Tailwind class strings para los elementos de UI del admin.
 * Reemplaza las clases CSS globales .adm-* — los estilos viven aquí,
 * en el código de componentes, no en globals.css.
 */
export const cls = {
  // Contenedores con borde
  panel: 'bg-card border border-(--bd) p-[22px_24px] mb-4',
  panelTable: 'bg-card border border-(--bd) overflow-hidden',
  kpi: 'bg-card border border-(--bd) p-[20px_22px]',

  // Tabla
  th: 'bg-surf font-display text-[11px] font-extrabold tracking-[1.5px] uppercase text-muted px-2.5 sm:px-4 py-[13px] text-left border-b border-(--bd)',
  td: 'px-2.5 sm:px-4 py-[13px] border-b border-(--bd) text-[14px] align-middle',

  // Tipografía
  label: 'text-[10px] tracking-[2px] uppercase text-(--gold) mb-1.5',
  title: 'font-display text-[22px] font-black uppercase tracking-tight',
  mono: 'font-mono text-[12px] text-muted',
  monoGold: 'font-mono text-[12px] text-(--gold)',
  val: 'font-display font-extrabold text-[16px]',
  valGold: 'font-display font-extrabold text-[16px] text-(--gold)',
  rowName: 'font-display font-extrabold text-[15px] uppercase',
  rowSub: 'text-[11px] text-muted uppercase tracking-[1px]',

  // Input
  input:
    'w-full bg-card border border-(--bd) text-text font-sans text-[14px] px-[13px] py-[11px] outline-none',
} as const
