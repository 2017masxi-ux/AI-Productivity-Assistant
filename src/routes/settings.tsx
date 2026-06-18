import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Moon, Sun, Trash2, Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Copilot Pro" },
      { name: "description", content: "Customize theme, data, and AI behavior." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();

  function clearAll() {
    if (typeof window === "undefined") return;
    ["copilot.tasks", "copilot.emails", "copilot.chat", "copilot.usage"].forEach((k) => localStorage.removeItem(k));
    toast.success("All local data cleared. Reload to see changes.");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader icon={SettingsIcon} title="Settings" subtitle="Tune your Copilot experience." />

      <Card className="glass-card border-border/50">
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <div>
              <Label className="text-sm font-medium">Dark mode</Label>
              <p className="text-xs text-muted-foreground">Comfortable for long focus sessions.</p>
            </div>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader><CardTitle className="text-base">Data & privacy</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tasks, emails, chats, and analytics are stored locally in your browser. Nothing is sent except the prompts you generate, which go to the Lovable AI Gateway.
          </p>
          <Button variant="destructive" onClick={clearAll}><Trash2 className="h-4 w-4" /> Clear all local data</Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader><CardTitle className="text-base">Responsible AI</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm flex gap-3">
            <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-foreground">AI outputs require human review.</div>
              <p className="text-xs text-muted-foreground mt-1">
                AI-generated content may contain inaccuracies, bias, or sensitive errors. Always review before sharing externally
                or making business decisions. Avoid pasting confidential personal data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div><span className="text-foreground font-medium">AI Productivity Copilot Pro</span> · v1.0</div>
          <div>Powered by Lovable AI Gateway · google/gemini-3-flash-preview</div>
        </CardContent>
      </Card>
    </div>
  );
}
