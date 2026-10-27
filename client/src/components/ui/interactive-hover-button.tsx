
import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

type HoverStyle = {
  text: string;
  leading?: React.ReactNode;
  active?: boolean;
  iconOnly?: boolean;
  chip?: boolean;
  className?: string;
};

type ButtonProps = HoverStyle &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

// Shared animation for normal buttons and category chips
function HoverContent({
  text,
  leading,
  iconOnly = false,
  chip = false,
}: Pick<HoverStyle, "text" | "leading" | "iconOnly" | "chip">) {
  return (
    <>
      {/* Original label */}
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-2",
          "transition-all duration-300",
          !iconOnly &&
            "group-hover:translate-x-12 group-hover:opacity-0",
          chip && "pl-4"
        )}
      >
        {leading}
        {!iconOnly && text}
      </span>

      {/* Animated hover label */}
      {!iconOnly && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-20",
            "flex translate-x-12 items-center justify-center gap-2",
            "whitespace-nowrap text-white opacity-0",
            "transition-all duration-300",
            "group-hover:translate-x-0 group-hover:opacity-100"
          )}
        >
          {text}
          {!chip && <ArrowRight className="h-4 w-4" />}
        </span>
      )}

      {/* ONE animated green circle */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute z-0",
          "left-3 top-1/2 -translate-y-1/2",
          "h-2 w-2 rounded-full bg-[#C6DE41]",
          "transition-all duration-300",
          "group-hover:left-0 group-hover:top-0",
          "group-hover:h-full group-hover:w-full",
          "group-hover:translate-y-0 group-hover:scale-[1.8]"
        )}
      />
    </>
  );
}

const baseClasses = cn(
  "group relative inline-flex min-h-10 w-auto cursor-pointer",
  "items-center justify-center overflow-hidden rounded-full border",
  "border-white/20 bg-[#12160F] px-5 py-2",
  "text-center text-[13px] font-semibold text-white",
  "transition-all duration-300",
  "focus-visible:outline-2 focus-visible:outline-offset-2",
  "focus-visible:outline-[#C6DE41]",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(
  (
    {
      text,
      leading,
      active = false,
      iconOnly = false,
      chip = false,
      className,
      type = "button",
      ...props
    },
    ref
  ) => (
    <button
      {...props}
      ref={ref}
      type={type}
      aria-label={iconOnly ? text : props["aria-label"]}
      className={cn(
        baseClasses,
        active && "bg-slate-950 text-white",
        iconOnly && "h-11 w-11 min-h-0 p-0",
        className
      )}
    >
      <HoverContent
        text={text}
        leading={leading}
        iconOnly={iconOnly}
        chip={chip}
      />
    </button>
  )
);

InteractiveHoverButton.displayName = "InteractiveHoverButton";

// Animated React Router links
type AnimatedLinkProps = {
  to: string;
  text: string;
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
  className?: string;
};

export function InteractiveHoverLink({
  to,
  text,
  variant = "primary",
  icon,
  className = "",
}: AnimatedLinkProps) {
  const primary = variant === "primary";

  return (
    <Link
      to={to}
      className={cn(
        "group relative inline-flex min-h-[54px] w-full",
        "items-center justify-center overflow-hidden",
        "rounded-full border px-6 py-3.5",
        "text-center text-[13px] font-semibold",
        "transition-all duration-300",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        primary
          ? "border-[#C6DE41] bg-[#C6DE41] text-[#090B09] font-bold shadow-[0_0_15px_rgba(198,222,65,0.3)]"
          : "border-white/15 bg-white/5 text-white hover:border-[#C6DE41]/50",
        className
      )}
    >
      {/* Original text — perfectly centered */}
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-2",
          "transition-all duration-300",
          "group-hover:translate-x-12 group-hover:opacity-0"
        )}
      >
        {text}
        {icon ?? <ArrowRight className="h-4 w-4" />}
      </span>

      {/* Replacement text — visible on hover */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-20",
          "flex translate-x-12 items-center justify-center gap-2",
          "whitespace-nowrap opacity-0",
          "transition-all duration-300",
          "group-hover:translate-x-0 group-hover:opacity-100",
          primary ? "text-[#090B09] font-bold" : "text-[#090B09] font-bold"
        )}
      >
        <span>{text}</span>
        {icon ?? <ArrowRight className="h-4 w-4" />}
      </span>

      {/* ONE expanding circle, aligned left */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute z-0",
          "left-4 top-1/2 -translate-y-1/2",
          "h-2 w-2 rounded-full",
          "transition-all duration-300",
          "group-hover:left-0 group-hover:top-0",
          "group-hover:h-full group-hover:w-full",
          "group-hover:translate-y-0 group-hover:scale-[1.8]",
          primary ? "bg-[#D7EF59]" : "bg-[#C6DE41]"
        )}
      />
    </Link>
  );
}

InteractiveHoverLink.displayName = "InteractiveHoverLink";
