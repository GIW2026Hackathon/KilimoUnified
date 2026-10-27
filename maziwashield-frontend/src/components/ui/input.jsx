import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef(function Input(
  { id, label, hint, error, icon: Icon, trailing, required, className, inputClassName, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block font-title-md text-xs text-primary">
          {label}
          {required && (
            <span className="text-error" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-outline"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded-[10px] border bg-white py-2.5 text-base text-on-surface outline-none transition-all placeholder:text-outline/60 focus:border-brand focus:ring-2 focus:ring-brand md:text-sm",
            Icon ? "pl-10" : "pl-3.5",
            trailing ? "pr-11" : "pr-4",
            error ? "border-error" : "border-line",
            inputClassName
          )}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-[11px] text-outline">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;