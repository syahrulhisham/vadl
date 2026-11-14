export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const BASE =
  'inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-md px-4 py-2 ' +
  'text-base font-medium transition-colors focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-lightblue-400 disabled:cursor-not-allowed ' +
  'disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-navy-700 text-white hover:bg-navy-800',
  secondary: 'bg-lightblue-100 text-navy-800 hover:bg-lightblue-200',
  ghost: 'bg-transparent text-navy-700 hover:bg-navy-50',
};

/** Class list for a button of the given variant, including the 44 px touch target (NFR-03). */
export function buttonClasses(variant: ButtonVariant = 'primary', extra = ''): string {
  return [BASE, VARIANTS[variant], extra].filter(Boolean).join(' ');
}
