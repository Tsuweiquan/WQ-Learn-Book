import { useTheme } from "@heroui/react";
import { createContext, use, type ReactNode } from "react";

type ThemeState = ReturnType<typeof useTheme>;

const ThemeContext = createContext<ThemeState | null>(null);

// HeroUI asks for a single theme controller per app; everything else reads it from here.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme("system");
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useAppTheme(): ThemeState {
  const theme = use(ThemeContext);
  if (!theme) throw new Error("useAppTheme must be used inside ThemeProvider");
  return theme;
}
