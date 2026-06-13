import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-brand text-white hover:bg-[#0b6c63]",
        variant === "secondary" && "border border-line bg-white text-ink hover:bg-panel",
        variant === "danger" && "bg-[#c2412f] text-white hover:bg-[#a83427]",
        variant === "ghost" && "text-muted hover:bg-panel hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
