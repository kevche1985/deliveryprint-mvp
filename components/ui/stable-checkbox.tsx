"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface StableCheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

const StableCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  StableCheckboxProps
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  // Handle the type conversion from boolean | "indeterminate" to boolean
  // Use useCallback to prevent infinite re-renders
  const handleCheckedChange = React.useCallback((checkedValue: boolean | "indeterminate") => {
    if (onCheckedChange && typeof checkedValue === "boolean") {
      onCheckedChange(checkedValue)
    }
  }, [onCheckedChange])

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      checked={checked}
      onCheckedChange={handleCheckedChange}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
StableCheckbox.displayName = "StableCheckbox"

export { StableCheckbox }