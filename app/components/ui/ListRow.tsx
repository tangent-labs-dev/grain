import type { ReactNode } from "react";

type ListRowProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
};

export function ListRow({ title, subtitle, trailing, onClick }: ListRowProps) {
  const rowClass =
    "w-full rounded-[var(--radius-sm)] border border-(--border) bg-(--surface) px-3 py-3 text-left hover:border-[rgba(255,255,255,0.35)]";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rowClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="matrix-label text-sm">{title}</p>
            {subtitle ? (
              <p className="mt-1 text-xs matrix-label text-(--muted)">{subtitle}</p>
            ) : null}
          </div>
          {trailing}
        </div>
      </button>
    );
  }

  return (
    <div className={rowClass}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="matrix-label text-sm">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-xs matrix-label text-(--muted)">{subtitle}</p>
          ) : null}
        </div>
        {trailing}
      </div>
    </div>
  );
}
