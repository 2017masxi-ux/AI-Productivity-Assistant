import { ShieldAlert } from "lucide-react";

export function AiDisclaimer({ confidence }: { confidence?: number }) {
  return (
    <div className="glass-card rounded-xl p-3 text-xs text-muted-foreground flex items-start gap-2">
      <ShieldAlert className="h-4 w-4 mt-0.5 text-warning shrink-0" />
      <div className="flex-1">
        <span className="font-medium text-foreground">AI-generated. Review before use.</span>{" "}
        Outputs may contain inaccuracies and should be reviewed before professional use. Human review recommended.
        {typeof confidence === "number" && (
          <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Confidence {Math.round(confidence)}%
          </span>
        )}
      </div>
    </div>
  );
}
