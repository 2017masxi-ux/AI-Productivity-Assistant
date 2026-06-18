import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Loader2, Save, FileDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { CopyButton } from "@/components/copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateEmail } from "@/lib/ai.functions";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { SavedEmail } from "@/lib/types";
import { toast } from "sonner";
import { exportTextAsPdf } from "@/lib/pdf";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator · Copilot Pro" },
      { name: "description", content: "Generate polished professional emails with tone and audience controls." },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Persuasive", "Executive"] as const;
const AUDIENCES = ["Client", "Manager", "Team Member", "Stakeholder"] as const;

function EmailPage() {
  const gen = useServerFn(generateEmail);
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Formal");
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("Client");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string; confidence: number } | null>(null);
  const [saved, setSaved] = useLocalStorage<SavedEmail[]>("copilot.emails", []);

  async function run() {
    if (!topic.trim()) return toast.error("Describe what the email is about");
    setLoading(true);
    try {
      const r = await gen({ data: { topic, context, tone, audience } });
      setResult(r);
      bumpUsage();
    } catch (e: any) {
      toast.error(e?.message ?? "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!result) return;
    const item: SavedEmail = {
      id: crypto.randomUUID(),
      subject: result.subject,
      body: result.body,
      tone,
      audience,
      createdAt: Date.now(),
    };
    setSaved([item, ...saved]);
    toast.success("Saved to library");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Mail}
        title="Smart Email Generator"
        subtitle="Compose ready-to-send emails with the right tone for every audience."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="glass-card lg:col-span-2 border-border/50">
          <CardHeader><CardTitle className="text-base">Brief</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>What's the email about?</Label>
              <Textarea
                placeholder="e.g. Postpone the Friday demo to next Tuesday and confirm the new agenda"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AUDIENCES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Extra context (optional)</Label>
              <Textarea placeholder="Recipient name, deadlines, prior thread…" value={context} onChange={(e) => setContext(e.target.value)} rows={3} />
            </div>
            <Button onClick={run} disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Generate email
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-3 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Draft</CardTitle>
            {result && (
              <div className="flex gap-2">
                <CopyButton text={`Subject: ${result.subject}\n\n${result.body}`} />
                <Button variant="outline" size="sm" onClick={save}><Save className="h-4 w-4" />Save</Button>
                <Button variant="outline" size="sm" onClick={() => exportTextAsPdf(`Email - ${result.subject}`, [
                  { heading: "Subject", body: result.subject },
                  { heading: "Body", body: result.body },
                ])}><FileDown className="h-4 w-4" />PDF</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading && <SkeletonEmail />}
            {!loading && !result && <EmptyState />}
            {!loading && result && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={result.subject} onChange={(e) => setResult({ ...result, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    value={result.body}
                    onChange={(e) => setResult({ ...result, body: e.target.value })}
                    rows={14}
                    className="font-[var(--font-sans)] leading-relaxed"
                  />
                </div>
                <AiDisclaimer confidence={result.confidence} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {saved.length > 0 && (
        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle className="text-base">Saved drafts</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {saved.slice(0, 6).map((s) => (
              <div key={s.id} className="rounded-xl border border-border/60 p-3 hover:bg-muted/40 transition-colors">
                <div className="text-sm font-medium line-clamp-1">{s.subject}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.tone} · {s.audience} · {new Date(s.createdAt).toLocaleDateString()}</div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{s.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-80 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
      <div className="h-12 w-12 rounded-2xl bg-muted grid place-items-center">
        <Mail className="h-5 w-5" />
      </div>
      <div className="font-medium text-foreground">Your draft will appear here</div>
      <div className="text-xs max-w-xs">Describe the email and Copilot will produce a polished subject line and body you can edit.</div>
    </div>
  );
}

function SkeletonEmail() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 w-1/2 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-11/12 rounded bg-muted" />
      <div className="h-4 w-10/12 rounded bg-muted" />
      <div className="h-4 w-8/12 rounded bg-muted" />
    </div>
  );
}

function bumpUsage() {
  if (typeof window === "undefined") return;
  try {
    const k = "copilot.usage";
    const today = new Date().toLocaleDateString(undefined, { weekday: "short" });
    const raw = JSON.parse(localStorage.getItem(k) || "[]") as { date: string; count: number }[];
    const last = raw[raw.length - 1];
    if (last?.date === today) last.count += 1;
    else raw.push({ date: today, count: 1 });
    localStorage.setItem(k, JSON.stringify(raw.slice(-30)));
  } catch {}
}
