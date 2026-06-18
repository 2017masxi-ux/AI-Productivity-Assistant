import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Loader2, FileDown, ShieldCheck, Loader } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { analyzeResearch, checkQuality } from "@/lib/ai.functions";
import { toast } from "sonner";
import { exportTextAsPdf } from "@/lib/pdf";
import { CopyButton } from "@/components/copy-button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant · Copilot Pro" },
      { name: "description", content: "Summarize articles and reports into insights, risks, and recommendations." },
    ],
  }),
  component: ResearchPage,
});

type R = Awaited<ReturnType<typeof analyzeResearch>>;
type Q = Awaited<ReturnType<typeof checkQuality>>;

function ResearchPage() {
  const research = useServerFn(analyzeResearch);
  const quality = useServerFn(checkQuality);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [qLoading, setQLoading] = useState(false);
  const [result, setResult] = useState<R | null>(null);
  const [q, setQ] = useState<Q | null>(null);

  async function run() {
    if (content.trim().length < 50) return toast.error("Paste at least a paragraph");
    setLoading(true); setQ(null);
    try { setResult(await research({ data: { content } })); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  async function evaluate() {
    if (!result) return;
    setQLoading(true);
    try {
      setQ(await quality({ data: { text: [result.executive_summary, ...result.key_insights, ...result.recommendations].join("\n") } }));
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setQLoading(false); }
  }

  function exportPdf() {
    if (!result) return;
    exportTextAsPdf("Research Summary", [
      { heading: "Executive Summary", body: result.executive_summary },
      { heading: "Key Insights", body: result.key_insights.map((s) => `• ${s}`).join("\n") },
      { heading: "Risks", body: result.risks.map((s) => `• ${s}`).join("\n") },
      { heading: "Recommendations", body: result.recommendations.map((s) => `• ${s}`).join("\n") },
      { heading: "Next Steps", body: result.next_steps.map((s) => `• ${s}`).join("\n") },
    ]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="AI Research Assistant"
        subtitle="Drop in an article, report, or document. Get insights, risks, and a recommended next move."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="glass-card lg:col-span-2 border-border/50">
          <CardHeader><CardTitle className="text-base">Source</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Paste article / report / transcript…" rows={16} value={content} onChange={(e) => setContent(e.target.value)} />
            <Button onClick={run} disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              Analyze
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-3 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Analysis</CardTitle>
            {result && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={evaluate} disabled={qLoading}>
                  {qLoading ? <Loader className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Quality check
                </Button>
                <CopyButton text={JSON.stringify(result, null, 2)} label="Copy" />
                <Button variant="outline" size="sm" onClick={exportPdf}><FileDown className="h-4 w-4" />PDF</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!result && !loading && (
              <div className="h-80 grid place-items-center text-sm text-muted-foreground">Paste content to begin</div>
            )}
            {loading && <div className="space-y-3 animate-pulse">{[...Array(6)].map((_, i) => <div key={i} className="h-4 rounded bg-muted" style={{ width: `${50 + Math.random() * 50}%` }} />)}</div>}
            {result && (
              <div className="space-y-5">
                <Sec title="Executive Summary"><p className="text-sm leading-relaxed">{result.executive_summary}</p></Sec>
                <Sec title="Key Insights"><Bullets items={result.key_insights} tint="primary" /></Sec>
                <Sec title="Risks"><Bullets items={result.risks} tint="warning" /></Sec>
                <Sec title="Recommendations"><Bullets items={result.recommendations} tint="success" /></Sec>
                <Sec title="Next Steps"><Bullets items={result.next_steps} tint="primary" /></Sec>
                <AiDisclaimer confidence={result.confidence} />
                {q && (
                  <div className="glass-card rounded-xl p-4 space-y-3">
                    <div className="font-medium text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Quality report</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(["professionalism", "clarity", "completeness", "overall"] as const).map((k) => (
                        <div key={k}>
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
                          <div className="flex items-center gap-2"><span className="text-lg font-semibold">{q[k]}</span><span className="text-xs text-muted-foreground">/100</span></div>
                          <Progress value={q[k]} className="h-1 mt-1" />
                        </div>
                      ))}
                    </div>
                    {q.risks.length > 0 && <div><div className="text-xs font-semibold uppercase mb-1 text-muted-foreground">Risks</div><Bullets items={q.risks} tint="warning" /></div>}
                    {q.improvements.length > 0 && <div><div className="text-xs font-semibold uppercase mb-1 text-muted-foreground">Improvements</div><Bullets items={q.improvements} tint="primary" /></div>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
function Bullets({ items, tint }: { items: string[]; tint: "primary" | "warning" | "success" }) {
  const tintMap = { primary: "text-primary", warning: "text-warning", success: "text-success" };
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((s, i) => <li key={i} className="flex gap-2"><span className={tintMap[tint]}>▸</span>{s}</li>)}
    </ul>
  );
}
