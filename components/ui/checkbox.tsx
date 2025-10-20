import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  icon?: React.ReactNode;
  labelClassName?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, label, icon, labelClassName, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
      onChange?.(e);
    };

    return (
      <div className="flex items-center">
        <div className="relative inline-flex items-center">
          {/* Checkbox input with larger touch target */}
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            checked={checked}
            onChange={handleChange}
            className={cn(
              "peer h-5 w-5 shrink-0 rounded-sm border border-input ring-offset-background",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "checked:bg-primary checked:border-primary",
              "cursor-pointer transition-colors hover:border-primary",
              className
            )}
            {...props}
          />
          {checked && (
            <Check className="absolute h-4 w-4 text-primary-foreground pointer-events-none left-0.5 top-0.5" />
          )}

          {/* Expanded touch area (48x48px minimum for mobile accessibility) */}
          <label
            htmlFor={checkboxId}
            className="absolute inset-0 -m-3 min-h-[48px] min-w-[48px] cursor-pointer"
            aria-hidden="true"
          />
        </div>

        {/* Optional label with icon */}
        {(label || icon) && (
          <label
            htmlFor={checkboxId}
            className={cn(
              'ml-2 text-sm font-medium leading-none cursor-pointer select-none',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              'flex items-center gap-1.5 py-3 pr-2', // Larger padding for mobile
              labelClassName
            )}
          >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox"

export { Checkbox }