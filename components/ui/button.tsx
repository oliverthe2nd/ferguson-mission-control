import Link from "next/link";
import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

const variants = {
  primary: "bg-emerald text-white hover:bg-emerald/90",
  secondary: "bg-dark text-white hover:bg-dark/90",
  ghost: "bg-transparent text-dark hover:bg-slate-100",
};

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
