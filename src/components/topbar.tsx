import { Moon, Sun, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";

export function TopBar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 backdrop-blur-xl px-4">
      <SidebarTrigger />
      <div className="hidden md:flex items-center gap-2 max-w-sm w-full">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search saved outputs, tasks, prompts…" className="pl-8 h-9 bg-muted/40" />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden sm:inline-flex h-7 items-center gap-1.5 rounded-full bg-success/10 text-success px-2.5 text-[11px] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> AI Online
        </span>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow grid place-items-center text-primary-foreground text-xs font-semibold">
          AP
        </div>
      </div>
    </header>
  );
}
