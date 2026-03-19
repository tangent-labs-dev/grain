"use client";

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </legend>
      <div
        className="grid gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-1"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))" }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`matrix-label rounded-[10px] px-2 py-2 text-[0.68rem] leading-tight min-[420px]:px-3 min-[420px]:text-xs ${
              value === option.value
                ? "bg-white text-black"
                : "text-[var(--foreground)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
