import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin text-current", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
      "2xl": "h-12 w-12",
      "3xl": "h-16 w-16",
      "4xl": "h-20 w-20",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export interface SpinnerProps
  extends React.SVGProps<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
  gradient?: boolean
  gradientFrom?: string
  gradientTo?: string
  speed?: "normal" | "slow" | "fast"
}

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  (
    {
      className,
      size,
      label = "Loading...",
      gradient = false,
      gradientFrom = "#A500E1",
      gradientTo = "#7B61FF",
      speed = "normal",
      ...props
    },
    ref
  ) => {
    const gradientId = React.useId()

    const strokeValue = gradient ? `url(#${gradientId})` : "currentColor"
    const animationDuration =
      speed === "slow" ? "1.2s" : speed === "fast" ? "0.5s" : "0.8s"

    return (
      <svg
        ref={ref}
        className={cn(spinnerVariants({ size, className }))}
        viewBox="0 0 24 24"
        role="status"
        aria-label={label}
        aria-live="polite"
        style={
          animationDuration
            ? { animationDuration, ...(props.style || {}) }
            : props.style
        }
        {...props}
      >
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>
        )}
        <path
          className="opacity-75"
          fill={strokeValue}
          d="M18.5 12c0-3.57-2.93-6.5-6.5-6.5v2.2c2.37 0 4.3 1.93 4.3 4.3z"
        />
      </svg>
    )
  }
)
Spinner.displayName = "Spinner"

export function SpinnerColor() {
  return (
    <div className="flex items-center gap-6">
      <Spinner size="lg" className="text-primary" label="Primary spinner" />
      <Spinner
        size="lg"
        className="text-uncar-green"
        label="UNCAR green spinner"
      />
      <Spinner size="lg" className="text-chart-1" label="Chart accent spinner" />
      <Spinner
        size="lg"
        className="text-chart-2"
        label="Chart secondary spinner"
      />
      <Spinner size="lg" className="text-destructive" label="Alert spinner" />
    </div>
  )
}

