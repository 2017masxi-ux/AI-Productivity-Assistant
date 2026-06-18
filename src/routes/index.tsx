import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  LayoutDashboard,
  Mail,
  FileText,
  ListChecks,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TaskItem } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AI Productivity Copilot Pro" },
      { name: "description", content: "Your productivity command center: scores, tasks, AI usage and quick actions." },
    ],
  }),
  component: Dashboard,
});

const tools = [
  { url: "/email", title: "Smart Email", desc: "Drafts in seconds", icon: Mail, accent: "from-violet-500 to-indigo-500" },
  { url: "/meetings", title: "Meeting Brief", desc: "Notes → structured summary", icon: FileText, accent: "from-sky-500 to-cyan-500" },
  { url: "/tasks", title: "Task Planner", desc: "Eisenhower + day plan", icon: ListChecks, accent: "from-emerald-500 to-teal-500" },
  { url: "/research", title: "Research", desc: "Insights & next steps", icon: BookOpen, accent: "from-amber-500 to-orange-500" },
  { url: "/chat", title: "Copilot Chat", desc: "Ask anything workplace", icon: MessageSquare, accent: "from-pink-500 to-rose-500" },
] as const;

function Dashboard() {
  const [tasks] = useLocalStorage<TaskItem[]>("copilot.tasks", []);
  const [usage] = useLocalStorage<{ date: string; count: number }[]>("copilot.usage", []);

  const completed = tasks.filter((t) => t.done).length;
  const pending = tasks.length - completed;
  const high = tasks.filter((t) => (t.priority ?? 0) >= 75 && !t.done).length;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (completed * 12) - (high * 4) + Math.min(usage.reduce((a, b) => a + b.count, 0) * 2, 40) + (tasks.length === 0 ? 40 : 0),
      ),
    ),
  );
  const minutesSaved = (completed * 9) + (usage.reduce((a, b) => a + b.count, 0) * 6);

  const chartData =
    usage.length > 0
      ? usage.slice(-7)
      : Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString(undefined, { weekday: "short" }),
          count: Math.round(2 + Math.sin(i) * 1.5 + i * 0.6),
        }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Welcome back"
        subtitle="Your AI workspace, productivity score, and quick launchers — all in one place."
        actions={
          <Button asChild className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
            <Link to="/chat"><Sparkles className="h-4 w-4" /> Ask Copilot</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <ScoreCard score={score} />
        <MetricCard icon={CheckCircle2} label="Completed" value={completed} hint={`${tasks.length} total tasks`} tint="success" />
        <MetricCard icon={Clock} label="Pending" value={pending} hint="In your backlog" tint="warning" />
        <MetricCard icon={AlertTriangle} label="High priority" value={high} hint="Tackle first" tint="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">AI activity · last 7 days</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Time saved: ~{minutesSaved} minutes</p>
            </div>
            <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> Trending up</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <RTooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--color-primary)" fill="url(#g1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Today's focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No tasks yet.{" "}
                <Link to="/tasks" className="text-primary underline underline-offset-4">Plan your day →</Link>
              </div>
            ) : (
              tasks
                .filter((t) => !t.done)
                .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
                .slice(0, 5)
                .map((t) => (
                  <div key={t.id} className="flex items-start gap-2 text-sm">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="font-medium leading-snug">{t.title}</div>
                      {t.deadline && <div className="text-xs text-muted-foreground">{t.deadline}</div>}
                    </div>
                    <Badge variant="outline" className="text-[10px]">{t.priority ?? "—"}</Badge>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick launchers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {tools.map((t) => (
            <Link
              key={t.url}
              to={t.url}
              className="group glass-card rounded-2xl p-4 hover:translate-y-[-2px] transition-all duration-300 hover:shadow-[var(--shadow-glow)]"
            >
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${t.accent} grid place-items-center mb-3`}>
                <t.icon className="h-5 w-5 text-white" />
              </div>
              <div className="font-medium text-sm flex items-center justify-between">
                {t.title}
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
  tint: "success" | "warning" | "destructive" | "primary";
}) {
  const tintMap = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <Card className="glass-card border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`h-9 w-9 rounded-lg grid place-items-center ${tintMap[tint]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <div className="text-sm font-medium mt-1">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

function ScoreCard({ score }: { score: number }) {
  return (
    <Card className="glass-card border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary-glow/10 pointer-events-none" />
      <CardContent className="p-5 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
            <TrendingUp className="h-4 w-4" />
          </div>
          <Badge variant="outline" className="text-[10px]">LIVE</Badge>
        </div>
        <div className="text-3xl font-semibold tracking-tight text-gradient">{score}<span className="text-base text-muted-foreground">/100</span></div>
        <div className="text-sm font-medium mt-1">Productivity Score</div>
        <Progress value={score} className="mt-3 h-1.5" />
      </CardContent>
    </Card>
  );
}
