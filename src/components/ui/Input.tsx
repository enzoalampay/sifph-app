"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-stone-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-md border border-stone-600 bg-stone-800 px-3 py-2
            text-sm text-stone-100 placeholder-stone-500
            focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50
            disabled:opacity-50
            ${error ? "border-red-500" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
