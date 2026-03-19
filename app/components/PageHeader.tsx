import type { ReactNode } from "react";

export function PageHeader({
  title,
  actions,
  showDivider = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showDivider?: boolean;
}) {
  return (
    <header className="mb-5">
      {showDivider ? <div className="glyph-line" /> : null}
      <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between">
        <h1 className="matrix-label max-w-full text-[clamp(1.65rem,8vw,2rem)] leading-none font-semibold">
          {title}
        </h1>
        {actions ? (
          <div className="flex w-full min-w-0 min-[420px]:w-auto min-[420px]:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
