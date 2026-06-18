import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MessageSquare, Send, Sparkles, Trash2, Square } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot · Copilot Pro" },
      { name: "description", content: "Chat with your AI workplace assistant for productivity, planning, and research." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Help me write a status update for my manager",
  "Plan a focused 90-minute work block on a tough decision",
  "Summarize how to run a productive 1:1",
  "Draft a polite reminder for an overdue invoice",
];

function ChatPage() {
  const [stored, setStored] = useLocalStorage<UIMessage[]>("copilot.chat", []);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport,
    messages: stored,
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (status === "ready" && messages.length > 0) setStored(messages);
  }, [status, messages, setStored]);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const busy = status === "submitted" || status === "streaming";

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || busy) return;
    setInput("");
    await sendMessage({ text: value });
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function clear() {
    setMessages([]);
    setStored([]);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={MessageSquare}
        title="AI Workplace Chatbot"
        subtitle="Your always-on assistant for productivity, planning, communication, and research."
        actions={
          <Button variant="outline" size="sm" onClick={clear} disabled={messages.length === 0}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        }
      />

      <Card className="glass-card border-border/50 flex flex-col h-[calc(100vh-220px)] min-h-[480px] overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {messages.length === 0 && (
            <div className="h-full grid place-items-center text-center">
              <div className="max-w-md space-y-4">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-[var(--shadow-glow)]">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">How can I help you today?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Ask anything about your work, planning, or communication.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-xl border border-border/60 p-3 text-sm hover:bg-muted/50 hover:border-primary/50 transition-all text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {status === "submitted" && <ThinkingBubble />}
        </div>

        <div className="border-t border-border/60 p-3 bg-background/40 backdrop-blur">
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Message Copilot…"
              rows={1}
              className="resize-none min-h-[44px] max-h-40 bg-muted/40"
            />
            {busy ? (
              <Button onClick={() => stop()} variant="outline" size="icon" className="h-11 w-11 shrink-0">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => send()} size="icon" className="h-11 w-11 shrink-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-2">
            <AiDisclaimer />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Message({ message }: { message: UIMessage }) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 text-xs font-semibold ${isUser ? "bg-muted" : "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"}`}>
        {isUser ? "You" : <Sparkles className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? "" : "flex-1"}`}>
        {isUser ? (
          <div className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap">{text}</div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-pre:bg-muted prose-pre:text-foreground">
            <ReactMarkdown>{text || "…"}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="flex items-center gap-1.5 pt-2.5">
        <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "120ms" }} />
        <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "240ms" }} />
      </div>
    </div>
  );
}
