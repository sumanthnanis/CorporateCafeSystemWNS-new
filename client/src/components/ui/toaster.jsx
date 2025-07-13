import { useToast } from "@/hooks/use-toast"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  console.log('Toaster rendering toasts:', toasts.length)

  return (
    <ToastProvider>
      <ToastViewport>
        {toasts.map(function ({ id, title, description, action, onOpenChange, ...props }) {
          console.log('Rendering toast:', id, title)
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose onClick={() => {
                console.log('Toast close button clicked for id:', id)
                dismiss(id)
                onOpenChange?.(false)
              }} />
            </Toast>
          )
        })}
      </ToastViewport>
    </ToastProvider>
  )
}