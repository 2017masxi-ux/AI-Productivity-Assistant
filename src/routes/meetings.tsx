import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, FileDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { summarizeMeeting } from "@/lib/ai.functions";
import { toast } from "sonner";
import { exportTextAsPdf } from "@/lib/pdf";
import { CopyButton } from "@/components/copy-button";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Intelligence · Copilot Pro" },
      { name: "description", content: "Turn meeting notes into structured summaries, decisions, and action items." },
    ],
  }),
  component: MeetingsPage,
});

type Result = Awaited<ReturnType<typeof summarizeMeeting>>;

function MeetingsPage() {
  const fn = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    if (notes.trim().length < 20) return toast.error("Paste at least a few sentences of notes");
    setLoading(true);
    try {
      setResult(await fn({ data: { notes } }));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  function exportPdf() {
    if (!result) return;
    exportTextAsPdf("Meeting Summary", [
      { heading: "Executive Summary", body: result.executive_summary },
      { heading: "Key Decisions", body: result.key_decisions.map((d) => `• ${d}`).join("\n") },
      {
        heading: "Action Items",
        body: result.action_items.map((a) => `• ${a.task} — ${a.owner} (by ${a.deadline})`).join("\n"),
      },
      { heading: "Risks", body: result.risks.map((r) => `• ${r}`).join("\n") },
    ]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Meeting Intelligence"
        subtitle="Paste raw notes or a transcript. Copilot extracts decisions, action items, owners and deadlines."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="glass-card lg:col-span-2 border-border/50">
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Paste meeting notes or transcript here…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={16}
            />
            <Button onClick={run} disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Summarize meeting
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-3 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Summary</CardTitle>
            {result && (
              <div className="flex gap-2">
                <CopyButton text={JSON.stringify(result, null, 2)} label="Copy JSON" />
                <Button variant="outline" size="sm" onClick={exportPdf}><FileDown className="h-4 w-4" />PDF</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading && <Skeleton />}
            {!loading && !result && <Empty />}
            {!loading && result && (
              <div className="space-y-5">
                <Section title="Executive Summary">
                  <p className="text-sm leading-relaxed">{result.executive_summary}</p>
                </Section>
                <Section title="Key Decisions">
                  <ul className="space-y-1.5 text-sm">
                    {result.key_decisions.map((d, i) => (
                      <li key={i} className="flex gap-2"><span className="text-primary">▸</span>{d}</li>
                    ))}
                  </ul>
                </Section>
                <Section title="Action Items">
                  <div className="space-y-2">
                    {result.action_items.map((a, i) => (
                      <div key={i} className="rounded-lg border border-border/60 p-3 text-sm bg-muted/30">
                        <div className="font-medium">{a.task}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">{a.owner}</Badge>
                          <Badge variant="outline" className="text-[10px]">Due {a.deadline}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
                {result.risks.length > 0 && (
                  <Section title="Risks & Open Questions">
                    <ul className="space-y-1.5 text-sm">
                      {result.risks.map((r, i) => <li key={i} className="flex gap-2"><span className="text-warning">!</span>{r}</li>)}
                    </ul>
                  </Section>
                )}
                <AiDisclaimer confidence={result.confidence} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div className="h-80 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
      <div className="h-12 w-12 rounded-2xl bg-muted grid place-items-center"><FileText className="h-5 w-5" /></div>
      <div className="font-medium text-foreground">Awaiting notes</div>
      <div className="text-xs max-w-xs">Paste your meeting transcript and Copilot will structure it instantly.</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(6)].map((_, i) => <div key={i} className="h-4 rounded bg-muted" style={{ width: `${60 + Math.random() * 40}%` }} />)}
    </div>
  );
}
