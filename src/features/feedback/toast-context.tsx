"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "info" | "success" | "error";

export type ToastAction = { label: string; onClick: () => void };

export type Toast = { id: number; message: string; tone: ToastTone; action?: ToastAction };

type ToastValue = {
  toasts: Toast[];
  toast: (message: string, tone?: ToastTone, action?: ToastAction) => void;
  dismissToast: (id: number) => void;
};

const TOAST_LIFETIME_MS = 4200;
const MAX_VISIBLE = 3;

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info", action?: ToastAction) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, message, tone, action }]);
      window.setTimeout(() => dismissToast(id), TOAST_LIFETIME_MS);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ toasts, toast, dismissToast }), [toasts, toast, dismissToast]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside AppProviders");
  return value;
}
