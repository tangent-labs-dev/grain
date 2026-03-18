"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/Button";

type ModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="mono-card max-h-[88vh] w-full max-w-lg overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[var(--border)] p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="matrix-label text-sm">{title}</p>
              {subtitle ? (
                <p className="mt-1 text-xs matrix-label text-[var(--muted)]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <Button variant="ghost" className="px-2 py-1 text-[0.64rem]" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="max-h-[62vh] overflow-y-auto p-4">{children}</div>
        {footer ? <div className="border-t border-[var(--border)] p-4">{footer}</div> : null}
      </div>
    </div>
  );
}
