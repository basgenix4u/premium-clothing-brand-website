"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";

/** Locks page scroll while an overlay is open. Restores the previous overflow value on close. */
export function useLockBody(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

export function useEscape(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onEscape]);
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = "right",
  label,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "right" | "left";
  label: string;
}) {
  useLockBody(open);
  useEscape(open, onClose);
  return (
    <div className={`drawer-root ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside
        className={`drawer drawer-${side}`}
        role="dialog"
        aria-modal={open}
        aria-label={label}
        aria-hidden={!open}
        inert={!open}
      >
        <header className="drawer-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="ghost-button"
            onClick={onClose}
            aria-label={`Close ${label}`}
          >
            <Icon.Close />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <footer className="drawer-foot">{footer}</footer> : null}
      </aside>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useLockBody(open);
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="modal-root is-open">
      <div className="drawer-scrim" onClick={onClose} />
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="drawer-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="ghost-button"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <Icon.Close />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
