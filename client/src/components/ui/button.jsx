import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = "button"
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    // Employee theme variants
    employee: "bg-employee-primary text-white hover:bg-employee-secondary shadow-lg rounded-full font-semibold transition-all duration-200 hover:scale-105",
    employeeSecondary: "bg-employee-secondary text-white hover:bg-employee-secondary/90 shadow-lg rounded-full font-semibold transition-all duration-200 hover:scale-105",
    employeeSuccess: "bg-employee-accent text-white hover:bg-employee-accent/90 shadow-lg rounded-full font-semibold transition-all duration-200 hover:scale-105",
    // Owner theme variants
    owner: "bg-owner-primary text-white hover:bg-owner-secondary shadow-lg rounded-full font-semibold transition-all duration-200 hover:scale-105",
    ownerSecondary: "bg-owner-secondary text-white hover:bg-owner-secondary/90 shadow-lg rounded-full font-semibold transition-all duration-200 hover:scale-105",
    ownerSuccess: "bg-owner-success text-white hover:bg-owner-success/90 shadow-lg rounded-full font-semibold transition-all duration-200 hover:scale-105",
  }
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    xl: "h-12 rounded-lg px-8 text-lg",
    icon: "h-10 w-10",
    mobile: "h-12 px-6 text-base mobile-touch-target", // Mobile-optimized
  }
  
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }