import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  rightSlot?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  { label, error, hint, rightSlot, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={cn(
            "w-full h-11 rounded-md border border-border bg-surface/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/70",
            "focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue/60 transition-all",
            "disabled:opacity-60",
            error && "border-destructive/60 focus:ring-destructive/40",
            rightSlot && "pr-10",
            className,
          )}
        />
        {rightSlot && <div className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</div>}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});
