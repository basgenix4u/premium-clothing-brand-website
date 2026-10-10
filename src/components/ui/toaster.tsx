"use client";

import { Icon } from "@/components/ui/icons";
import { useToast } from "@/features/feedback/toast-context";

export function Toaster() {
  const { toasts, dismissToast } = useToast();
  return (
    <div className="toaster" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.tone}`} role="status">
          <span>{toast.message}</span>
          {toast.action ? (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.action?.onClick();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          ) : null}
          <button
            type="button"
            className="toast-close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss"
          >
            <Icon.Close />
          </button>
        </div>
      ))}
    </div>
  );
}
