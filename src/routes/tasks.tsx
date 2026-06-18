import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ListChecks, Loader2, Plus, Trash2, Calendar as CalIcon, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { planTasks } from "@/lib/ai.functions";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { TaskItem } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner · Copilot Pro" },
      { name: "description", content: "Prioritize tasks with the Eisenhower matrix and generate a daily plan." },
    ],
  }),
  component: TasksPage,
});

const QUADRANT_TINT: Record<string, string> = {
  "Urgent & Important": "bg-destructive/15 text-destructive border-destructive/30",
  "Important Not Urgent": "bg-primary/15 text-primary border-primary/30",
  "Urgent Not Important": "bg-warning/15 text-warning border-warning/30",
  "Neither": "bg-muted text-muted-foreground border-border",
};

function TasksPage() {
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useLocalStorage<TaskItem[]>("copilot.tasks", []);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof planTasks>> | null>(null);
  const [loading, setLoading] = useState(false);

  function addTask() {
    if (!title.trim()) return;
    setTasks([{ id: crypto.randomUUID(), title, deadline }, ...tasks]);
    setTitle(""); setDeadline("");
  }
  function remove(id: string) { setTasks(tasks.filter((t) => t.id !== id)); }
  function toggle(id: string) { setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); }

  async function run() {
    if (tasks.length === 0) return toast.error("Add at least one task");
    setLoading(true);
    try {
      const res = await fn({ data: { tasks: tasks.map((t) => ({ title: t.title, deadline: t.deadline, notes: t.notes })) } });
      setPlan(res);
      // merge priorities back into tasks by title
      setTasks(
        tasks.map((t) => {
          const match = res.prioritized.find((p) => p.title === t.title);
          return match ? { ...t, priority: match.priority_score, quadrant: match.quadrant } : t;
        }),
      );
      toast.success("Plan ready");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ListChecks}
        title="AI Smart Task Planner"
        subtitle="Drop in tasks, get an Eisenhower-prioritized day plan with recommended time slots."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="glass-card lg:col-span-2 border-border/50">
          <CardHeader><CardTitle className="text-base">Your tasks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
              <Input placeholder="Deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-32" />
              <Button onClick={addTask} variant="outline"><Plus className="h-4 w-4" /></Button>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">No tasks yet — add a few above</div>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5 bg-muted/20">
                    <Checkbox checked={t.done} onCheckedChange={() => toggle(t.id)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {t.deadline && <Badge variant="outline" className="text-[10px]">{t.deadline}</Badge>}
                        {t.quadrant && <Badge className={`text-[10px] border ${QUADRANT_TINT[t.quadrant] ?? ""}`} variant="outline">{t.quadrant}</Badge>}
                        {typeof t.priority === "number" && <Badge variant="secondary" className="text-[10px]">P {t.priority}</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(t.id)} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))
              )}
            </div>

            <Button onClick={run} disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate AI plan
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-3 border-border/50">
          <CardHeader><CardTitle className="text-base">AI plan</CardTitle></CardHeader>
          <CardContent>
            {!plan && <div className="h-80 grid place-items-center text-sm text-muted-foreground">Add tasks and generate a plan</div>}
            {plan && (
              <Tabs defaultValue="day">
                <TabsList>
                  <TabsTrigger value="day">Daily</TabsTrigger>
                  <TabsTrigger value="week">Weekly</TabsTrigger>
                  <TabsTrigger value="matrix">Matrix</TabsTrigger>
                  <TabsTrigger value="tips">Tips</TabsTrigger>
                </TabsList>
                <TabsContent value="day" className="space-y-2 mt-4">
                  {plan.daily_plan.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 p-3 bg-muted/20">
                      <div className="h-9 w-20 rounded-md bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                        <CalIcon className="h-3 w-3 mr-1" />{d.time}
                      </div>
                      <div className="text-sm">{d.task}</div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="week" className="mt-4">
                  <ul className="space-y-2">
                    {plan.weekly_focus.map((w, i) => (
                      <li key={i} className="rounded-lg border border-border/60 p-3 bg-muted/20 text-sm">{w}</li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="matrix" className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {(["Urgent & Important", "Important Not Urgent", "Urgent Not Important", "Neither"] as const).map((q) => (
                    <div key={q} className={`rounded-xl border p-3 ${QUADRANT_TINT[q]}`}>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-2">{q}</div>
                      <ul className="space-y-1.5 text-sm text-foreground">
                        {plan.prioritized.filter((p) => p.quadrant === q).map((p, i) => (
                          <li key={i} className="flex items-start justify-between gap-2">
                            <span>{p.title}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">{p.priority_score}</Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="tips" className="mt-4">
                  <ul className="space-y-2">
                    {plan.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm rounded-lg border border-border/60 p-3 bg-muted/20">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            )}
            {plan && <div className="mt-4"><AiDisclaimer confidence={plan.confidence} /></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
