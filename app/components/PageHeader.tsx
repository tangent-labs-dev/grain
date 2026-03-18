import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5">
      <p className="screen-title">{subtitle ?? "Grain Finance"}</p>
      <div className="glyph-line" />
      <div className="flex items-end justify-between gap-3">
        <h1 className="matrix-label text-2xl font-semibold">
          {title}
        </h1>
        {actions}
      </div>
    </header>
  );
}
