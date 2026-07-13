import { useRef, useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { themes } from '../theme/themes';

/** Palette swatch icon */
function PaletteIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="8.5" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <path d="M5.6 16.4a9 9 0 0 1 12.8 0" />
    </svg>
  );
}

export function ThemeSelector() {
  const { theme, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select theme"
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-xl hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <PaletteIcon className="h-3.5 w-3.5" />
        <span>{theme.label}</span>
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Themes"
          className="absolute right-0 top-full z-[9999] mt-1.5 min-w-[11rem] overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80 py-1 shadow-2xl backdrop-blur-2xl"
        >
          {themes.map((t) => (
            <li
              key={t.id}
              role="option"
              aria-selected={t.id === theme.id}
              onClick={() => {
                setThemeId(t.id);
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setThemeId(t.id);
                  setOpen(false);
                }
              }}
              tabIndex={0}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none ${
                t.id === theme.id ? 'text-white' : 'text-white/70'
              }`}
            >
              <span>{t.label}</span>
              {t.id === theme.id && (
                <svg
                  className="h-3.5 w-3.5 text-white/80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
