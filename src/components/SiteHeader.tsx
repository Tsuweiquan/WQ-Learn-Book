import { BookOpen, Display, Moon, Sun } from "@gravity-ui/icons";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Link } from "react-router";

import { useAppTheme } from "../lib/theme";

function ThemeSwitcher() {
  const { theme, setTheme } = useAppTheme();
  return (
    <ToggleButtonGroup
      aria-label="Colour theme"
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[theme]}
      onSelectionChange={(keys) => {
        const [next] = keys;
        if (next) setTheme(String(next));
      }}
    >
      <ToggleButton id="light" isIconOnly aria-label="Light theme">
        <Sun />
      </ToggleButton>
      <ToggleButton id="dark" isIconOnly aria-label="Dark theme">
        <ToggleButtonGroup.Separator />
        <Moon />
      </ToggleButton>
      <ToggleButton id="system" isIconOnly aria-label="Match system theme">
        <ToggleButtonGroup.Separator />
        <Display />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[920px] items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground no-underline">
          <BookOpen className="text-accent" />
          WQ <span className="text-accent">Learn</span> Book
        </Link>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
