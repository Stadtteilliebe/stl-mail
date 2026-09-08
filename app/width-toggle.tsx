"use client";

// Gleiche drei Breakpoints wie im alten email-builder.html
// ("Desktop 1000 / Tablet 700 / Mobile 375"), damit sich responsive
// Absätze (Fließtext-Schriftgröße, Footer-Umbruch) vor dem Versand prüfen
// lassen.
export const PREVIEW_WIDTHS = [
  { key: "desktop", label: "Desktop", px: 1000 },
  { key: "tablet", label: "Tablet", px: 700 },
  { key: "mobile", label: "Handy", px: 375 },
] as const;

export type PreviewWidthKey = (typeof PREVIEW_WIDTHS)[number]["key"];

export function WidthToggle({
  value,
  onChange,
}: {
  value: PreviewWidthKey;
  onChange: (key: PreviewWidthKey) => void;
}) {
  return (
    <div className="flex gap-1">
      {PREVIEW_WIDTHS.map((w) => (
        <button
          key={w.key}
          onClick={() => onChange(w.key)}
          className={`text-xs px-2.5 py-1 rounded-md border ${
            value === w.key
              ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
              : "border-black/[.08] dark:border-white/[.145] hover:bg-black/[.03] dark:hover:bg-white/[.06]"
          }`}
        >
          {w.label} {w.px}
        </button>
      ))}
    </div>
  );
}
