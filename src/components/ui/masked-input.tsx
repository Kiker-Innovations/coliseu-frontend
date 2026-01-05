import * as React from "react";
import InputMask from "react-input-mask";
import { cn } from "@/lib/utils";

export interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  mask: string;
  maskChar?: string | null;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  (
    { className, mask, maskChar = "_", onChange, onValueChange, ...props },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
      if (onValueChange) {
        onValueChange(e.target.value);
      }
    };

    return (
      <InputMask
        mask={mask}
        maskChar={maskChar}
        onChange={handleChange}
        {...props}
      >
        {(inputProps: React.InputHTMLAttributes<HTMLInputElement>) => (
          <input
            {...inputProps}
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
