import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-black/35 focus:border-black/30 focus:ring-4 focus:ring-black/[.04]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

