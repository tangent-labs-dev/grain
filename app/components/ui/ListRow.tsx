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
        <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <div className="min-w-0">
            <p className="matrix-label text-sm">{title}</p>
            {subtitle ? (
              <p className="mt-1 text-xs matrix-label text-(--muted)">{subtitle}</p>
            ) : null}
          </div>
          {trailing ? <div className="w-full min-[420px]:w-auto">{trailing}</div> : null}
        </div>
      </button>
    );
  }

  return (
    <div className={rowClass}>
      <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div className="min-w-0">
          <p className="matrix-label text-sm">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-xs matrix-label text-(--muted)">{subtitle}</p>
          ) : null}
        </div>
        {trailing ? <div className="w-full min-[420px]:w-auto">{trailing}</div> : null}
      </div>
    </div>
  );
}
