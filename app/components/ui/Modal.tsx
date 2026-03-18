"use client";

import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 280);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center p-3 transition-all duration-280 ease-out sm:items-center ${
        visible ? "bg-black/68 opacity-100 backdrop-blur-[1px]" : "bg-black/0 opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`mono-card max-h-[88vh] w-full max-w-lg overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.97] opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-(--border) p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="matrix-label text-sm">{title}</p>
              {subtitle ? (
                <p className="mt-1 text-xs matrix-label text-(--muted)">
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
        {footer ? <div className="border-t border-(--border) p-4">{footer}</div> : null}
      </div>
    </div>
  );
}
