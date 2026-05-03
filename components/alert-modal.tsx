"use client"

import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type AlertVariant = "info" | "warning" | "error" | "success"

interface AlertModalProps {
  open: boolean
  title: string
  message: string
  variant?: AlertVariant
  confirmLabel?: string
  onConfirm: () => void
}

const variantConfig: Record<AlertVariant, {
  icon: typeof Info
  iconClass: string
  borderClass: string
  bgClass: string
  titleClass: string
  buttonClass: string
}> = {
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    borderClass: "border-blue-500/20",
    bgClass: "bg-blue-500/10",
    titleClass: "text-blue-400",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    borderClass: "border-amber-500/20",
    bgClass: "bg-amber-500/10",
    titleClass: "text-amber-400",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-500",
    borderClass: "border-red-500/20",
    bgClass: "bg-red-500/10",
    titleClass: "text-red-400",
    buttonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  success: {
    icon: CheckCircle,
    iconClass: "text-green-500",
    borderClass: "border-green-500/20",
    bgClass: "bg-green-500/10",
    titleClass: "text-green-400",
    buttonClass: "bg-green-600 hover:bg-green-700 text-white",
  },
}

export function AlertModal({
  open,
  title,
  message,
  variant = "info",
  confirmLabel = "OK",
  onConfirm,
}: AlertModalProps) {
  if (!open) return null

  const cfg = variantConfig[variant]
  const Icon = cfg.icon

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onConfirm}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-sm rounded-xl border ${cfg.borderClass} bg-card shadow-2xl shadow-black/40`}
      >
        {/* Top accent bar */}
        <div className={`h-1 w-full rounded-t-xl ${cfg.bgClass.replace('bg-', 'bg-').replace('/10', '/60')}`} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.bgClass} border ${cfg.borderClass}`}>
              <Icon className={`h-5 w-5 ${cfg.iconClass}`} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="alert-modal-title"
                className={`text-sm font-semibold ${cfg.titleClass}`}
              >
                {title}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={onConfirm}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Action */}
          <div className="mt-5 flex justify-end">
            <button
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${cfg.buttonClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
