import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes Tailwind de forma segura: usa clsx para juntar
 * condicionalmente as classes e tailwind-merge para resolver conflitos
 * (ex: "p-2" e "p-4" juntos → mantém só "p-4"). Convenção padrão do
 * shadcn/ui, usada por praticamente todo componente de UI do projeto.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
