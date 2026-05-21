import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

type RequiredLabelProps = {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
};

export function RequiredLabel({
  children,
  htmlFor,
  required = false,
  className,
}: RequiredLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={className}>
      {children}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </Label>
  );
}
