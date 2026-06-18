import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Library, Search, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/prompts")({
  head: () => ({
    meta: [
      { title: "Prompt Library · Copilot Pro" },
      { name: "description", content: "Curated prompt templates for emails, meetings, research, planning, and productivity." },
    ],
  }),
  component: Prompts,
});

type Prompt = { id: string; category: string; title: string; body: string };

const PROMPTS: Prompt[] = [
  { id: "e1", category: "Emails", title: "Polite follow-up", body: "Write a polite follow-up email to {recipient} about {topic}. Tone: professional but warm. Include a single clear call to action." },
  { id: "e2", category: "Emails", title: "Decline meeting", body: "Decline a meeting invitation from {recipient} for {date}, propose two alternative times, and briefly explain the conflict." },
  { id: "e3", category: "Emails", title: "Cold outreach", body: "Write a personalized cold outreach email to {recipient} at {company}. Reference their recent {trigger} and propose a 20-min intro call." },
  { id: "m1", category: "Meetings", title: "Pre-read brief", body: "Create a one-page pre-read for an upcoming meeting about {topic}. Include context, goals, options, and recommended decision." },
  { id: "m2", category: "Meetings", title: "Stand-up summary", body: "Summarize this stand-up transcript into yesterday, today, blockers per person:\n\n{transcript}" },
  { id: "r1", category: "Research", title: "Compare options", body: "Compare {option_a} vs {option_b} across cost, time-to-value, risk, and team fit. Recommend one and justify in 3 bullets." },
  { id: "r2", category: "Research", title: "SWOT analysis", body: "Produce a SWOT analysis for {subject} using only verifiable facts. Flag any assumptions explicitly." },
  { id: "p1", category: "Planning", title: "Weekly planning", body: "Given my goals {goals} and obligations {obligations}, build a balanced weekly plan with deep-work blocks, recovery, and one stretch goal." },
  { id: "p2", category: "Planning", title: "OKR draft", body: "Draft 3 quarterly objectives and 3 measurable key results each for the {team} team aligned to {north_star}." },
  { id: "g1", category: "Productivity", title: "Daily review", body: "Walk me through a 5-minute end-of-day review. Ask me what worked, what didn't, what to drop, and one tiny improvement for tomorrow." },
  { id: "g2", category: "Productivity", title: "Decision matrix", body: "Help me decide between {choices}. Build a weighted matrix with criteria, weights, and scores, then recommend." },
];

const CATS = ["All", "Emails", "Meetings", "Research", "Planning", "Productivity"];

function Prompts() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const filtered = PROMPTS.filter(
    (p) => (tab === "All" || p.category === tab) && (q === "" || (p.title + p.body).toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <PageHeader icon={Library} title="AI Prompt Library" subtitle="Battle-tested prompt templates. Copy and customize." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search prompts…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {CATS.map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={tab}>
        <TabsContent value={tab} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((p) => <PromptCard key={p.id} prompt={p} />)}
            {filtered.length === 0 && <div className="text-sm text-muted-foreground col-span-full text-center py-12">No prompts match.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PromptCard({ prompt }: { prompt: Prompt }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card className="glass-card border-border/50 hover:shadow-[var(--shadow-glow)] transition-shadow">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="secondary" className="text-[10px] mb-1.5">{prompt.category}</Badge>
            <div className="font-medium text-sm">{prompt.title}</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={async () => {
              await navigator.clipboard.writeText(prompt.body);
              setCopied(true);
              toast.success("Prompt copied");
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">{prompt.body}</p>
      </CardContent>
    </Card>
  );
}
