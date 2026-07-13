import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { themes, defaultThemeId, type Theme } from './themes';

const STORAGE_KEY = 'weather-theme';

interface ThemeContextValue {
  theme: Theme;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? themes.find((t) => t.id === defaultThemeId)!;
}

function readStoredThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultThemeId;
  } catch {
    return defaultThemeId;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(readStoredThemeId()));

  const applyTheme = useCallback((t: Theme) => {
    // Write CSS custom property onto <html> so index.css can reference it
    document.documentElement.style.setProperty('--body-bg', t.bodyBackground);
    document.documentElement.style.setProperty('--sidebar-bg', t.sidebarBg);
    document.documentElement.setAttribute('data-theme', t.id);
  }, []);

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setThemeId = useCallback((id: string) => {
    const next = resolveTheme(id);
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
