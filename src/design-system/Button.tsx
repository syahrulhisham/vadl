import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';
import { buttonClasses, type ButtonVariant } from './buttonClasses';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
}

/** A button with a touch target of at least 44 × 44 px (NFR-03). Defaults to type="button". */
export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...rest} />;
}

export interface LinkButtonProps {
  readonly to: string;
  readonly variant?: ButtonVariant;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Navigation styled as a button. Uses a real link so it works with middle-click and screen readers. */
export function LinkButton({ to, variant = 'primary', className = '', children }: LinkButtonProps) {
  return (
    <Link to={to} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}
