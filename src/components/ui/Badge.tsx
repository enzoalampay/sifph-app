"use client";

import { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "faction";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  color?: string; // Custom color for faction variant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-stone-700 text-stone-300 border-stone-600",
  success: "bg-green-900/60 text-green-300 border-green-700/50",
  warning: "bg-amber-900/60 text-amber-300 border-amber-700/50",
  error: "bg-red-900/60 text-red-300 border-red-700/50",
  info: "bg-blue-900/60 text-blue-300 border-blue-700/50",
  faction: "", // Uses custom color
};

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
};

export function Badge({
  variant = "default",
  size = "md",
  color,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const customStyle = variant === "faction" && color ? { backgroundColor: `${color}20`, color, borderColor: `${color}40` } : {};

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium whitespace-nowrap
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      style={customStyle}
      {...props}
    >
      {children}
    </span>
  );
}
