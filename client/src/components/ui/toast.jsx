import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ({ children }) => {
  return <div>{children}</div>
}

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-[99999] flex max-h-screen w-auto flex-col gap-2 max-w-[420px] min-w-[300px] pointer-events-none",
      className
    )}
    style={{ 
      position: 'fixed !important',
      top: '16px !important',
      right: '16px !important',
      zIndex: '99999 !important'
    }}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  const variants = {
    default: "border bg-background text-foreground shadow-lg dark:bg-card dark:text-card-foreground",
    destructive: "border-destructive bg-destructive/10 text-destructive shadow-lg dark:bg-destructive/20 dark:text-destructive-foreground",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all animate-in slide-in-from-top-2 duration-300",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  )
})
Toast.displayName = "Toast"

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-border text-foreground dark:border-border dark:text-foreground dark:hover:bg-secondary/80 group-[.destructive]:border-destructive/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"

const ToastClose = React.forwardRef(({ className, onClick, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('Toast close clicked')
      onClick?.(e)
    }}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring opacity-100 cursor-pointer z-50 dark:text-muted-foreground dark:hover:text-foreground",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
))
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold text-foreground dark:text-foreground", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90 text-muted-foreground dark:text-muted-foreground", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}