"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

type MenuPosition = {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
};

export function Select({
  value,
  options,
  onChange,
  placeholder = "Select",
  disabled = false,
  className = "",
  ariaLabel,
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    left: 0,
    width: 0,
    top: 0,
    maxHeight: 260,
  });
  const [opensUpward, setOpensUpward] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const isDisabled = disabled || options.length === 0;
  const selectedLabel = selected?.label ?? placeholder;

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 8;
    const verticalGap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const shouldOpenUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(280, shouldOpenUpward ? spaceAbove - verticalGap : spaceBelow - verticalGap),
    );

    const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
    const left = Math.max(
      viewportPadding,
      Math.min(rect.left, window.innerWidth - width - viewportPadding),
    );

    setOpensUpward(shouldOpenUpward);
    setMenuPosition(
      shouldOpenUpward
        ? {
            left,
            width,
            bottom: window.innerHeight - rect.top + verticalGap,
            maxHeight,
          }
        : {
            left,
            width,
            top: rect.bottom + verticalGap,
            maxHeight,
          },
    );
  }, []);

  useEffect(() => {
    if (!open) return;

    const frameId = window.requestAnimationFrame(() => {
      updateMenuPosition();
    });

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onWindowChange = () => updateMenuPosition();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("scroll", onWindowChange, true);
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("orientationchange", onWindowChange);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", onWindowChange, true);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("orientationchange", onWindowChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, updateMenuPosition]);

  const menuStyle: CSSProperties = {
    position: "fixed",
    zIndex: 70,
    left: menuPosition.left,
    width: menuPosition.width,
    maxHeight: menuPosition.maxHeight,
    ...(opensUpward
      ? { bottom: menuPosition.bottom }
      : { top: menuPosition.top }),
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`matrix-label inline-flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm text-[var(--foreground)] hover:border-[rgba(255,255,255,0.45)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => {
          if (isDisabled) return;
          setOpen((current) => !current);
        }}
      >
        <span className={`${selected ? "" : "text-[var(--muted)]"}`}>{selectedLabel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9.5L12 15.5L18 9.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
        </svg>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className={`mono-card overflow-hidden ${opensUpward ? "origin-bottom" : "origin-top"}`}
            >
              <ul
                role="listbox"
                className="overflow-y-auto py-1"
                aria-label={ariaLabel}
                style={{ maxHeight: menuPosition.maxHeight }}
              >
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        className={`matrix-label flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[0.74rem] ${
                          option.disabled
                            ? "cursor-not-allowed text-[var(--muted)] opacity-60"
                            : isSelected
                              ? "bg-[var(--surface-elevated)] text-[var(--foreground)]"
                              : "text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                        }`}
                        onClick={() => {
                          if (option.disabled) return;
                          onChange(option.value);
                          setOpen(false);
                          triggerRef.current?.focus();
                        }}
                      >
                        <span>{option.label}</span>
                        {isSelected ? (
                          <span className="text-[0.66rem] text-[var(--muted)]">Selected</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
