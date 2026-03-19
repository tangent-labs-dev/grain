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
    let mountTimer = 0;
    let enterFrame = 0;
    let exitFrame = 0;
    let exitTimer = 0;

    if (open) {
      mountTimer = window.setTimeout(() => {
        setMounted(true);
        enterFrame = window.requestAnimationFrame(() => setVisible(true));
      }, 0);
      return () => {
        window.clearTimeout(mountTimer);
        window.cancelAnimationFrame(enterFrame);
      };
    }

    if (mounted) {
      exitFrame = window.requestAnimationFrame(() => setVisible(false));
      exitTimer = window.setTimeout(() => setMounted(false), 280);
    }

    return () => {
      window.cancelAnimationFrame(exitFrame);
      window.clearTimeout(exitTimer);
    };
  }, [mounted, open]);

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
      className={`fixed inset-0 z-50 flex items-end justify-center p-2 transition-all duration-280 ease-out min-[420px]:p-3 sm:items-center ${
        visible ? "bg-black/68 opacity-100 backdrop-blur-[1px]" : "bg-black/0 opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`mono-card max-h-[92vh] w-full max-w-lg overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] min-[420px]:max-h-[88vh] ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.97] opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-(--border) p-3 min-[420px]:p-4">
          <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
            <div>
              <p className="matrix-label text-sm">{title}</p>
              {subtitle ? (
                <p className="mt-1 text-xs matrix-label text-(--muted)">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              className="px-2 py-1 text-[0.64rem]"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
        <div className="max-h-[66vh] overflow-y-auto p-3 min-[420px]:max-h-[62vh] min-[420px]:p-4">
          {children}
        </div>
        {footer ? (
          <div className="border-t border-(--border) p-3 min-[420px]:p-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
