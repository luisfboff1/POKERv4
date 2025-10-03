'use client';

import * as React from 'react';
import { cn } from '../../../lib/utils';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => (
    <form
      ref={ref}
      className={cn('space-y-6', className)}
      {...props}
    />
  )
);
Form.displayName = 'Form';

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('form-group', className)} {...props}>
      {children}
    </div>
  )
);
FormField.displayName = 'FormField';

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props} />
  )
);
FormItem.displayName = 'FormItem';

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
);
FormLabel.displayName = 'FormLabel';

interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ ...props }, ref) => <div ref={ref} {...props} />
);
FormControl.displayName = 'FormControl';

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
FormDescription.displayName = 'FormDescription';

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) {
      return null;
    }

    return (
      <p
        ref={ref}
        className={cn('text-sm font-medium text-destructive', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
FormMessage.displayName = 'FormMessage';

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
};

export type { FormProps };