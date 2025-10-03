import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../../lib/utils';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 bg-label text-label-foreground',
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {}

export { Label };
