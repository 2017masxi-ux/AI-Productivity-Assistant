import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway.server";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)(DEFAULT_MODEL);
}

// ---------- Email Generator ----------
const EmailInput = z.object({
  topic: z.string().min(1),
  tone: z.enum(["Formal", "Friendly", "Persuasive", "Executive"]),
  audience: z.enum(["Client", "Manager", "Team Member", "Stakeholder"]),
  context: z.string().optional(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          subject: z.string(),
          body: z.string(),
          confidence: z.number().min(0).max(100),
        }),
      }),
      system:
        "You are an expert business communication coach. Write polished, ready-to-send emails. Use Role + Context + Audience + Step-by-step reasoning before drafting. Return ONLY the requested JSON.",
      prompt: `ROLE: Senior business writer crafting an email.
AUDIENCE: ${data.audience}
TONE: ${data.tone}
TOPIC / GOAL: ${data.topic}
ADDITIONAL CONTEXT: ${data.context || "none"}

STEPS:
1. Identify the recipient's perspective and information needs.
2. Decide the email's single primary call to action.
3. Draft a concise, scannable email (greeting, 2-4 short paragraphs, sign-off).
4. Produce a clear, specific subject line (max 9 words).
5. Self-rate your confidence (0-100) that this is professional and complete.

OUTPUT JSON: { subject, body, confidence }`,
    });
    return output;
  });

// ---------- Meeting Summarizer ----------
const MeetingInput = z.object({ notes: z.string().min(20) });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MeetingInput.parse(d))
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          executive_summary: z.string(),
          key_decisions: z.array(z.string()),
          action_items: z.array(
            z.object({
              task: z.string(),
              owner: z.string(),
              deadline: z.string(),
            }),
          ),
          risks: z.array(z.string()),
          confidence: z.number().min(0).max(100),
        }),
      }),
      system:
        "You are a senior chief-of-staff. Extract structure from raw meeting notes with high precision. Think step-by-step but return only the JSON.",
      prompt: `MEETING NOTES:
"""
${data.notes}
"""

STEPS:
1. Read carefully and identify implicit decisions and owners.
2. Extract action items with owner + deadline (use "TBD" if missing).
3. Note risks and open questions.
4. Self-rate confidence.

Return JSON: { executive_summary, key_decisions[], action_items[{task,owner,deadline}], risks[], confidence }`,
    });
    return output;
  });

// ---------- Task Planner ----------
const PlannerInput = z.object({
  tasks: z
    .array(z.object({ title: z.string(), deadline: z.string().optional(), notes: z.string().optional() }))
    .min(1),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PlannerInput.parse(d))
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          prioritized: z.array(
            z.object({
              title: z.string(),
              quadrant: z.enum(["Urgent & Important", "Important Not Urgent", "Urgent Not Important", "Neither"]),
              priority_score: z.number().min(0).max(100),
              recommended_slot: z.string(),
              rationale: z.string(),
            }),
          ),
          daily_plan: z.array(z.object({ time: z.string(), task: z.string() })),
          weekly_focus: z.array(z.string()),
          recommendations: z.array(z.string()),
          confidence: z.number().min(0).max(100),
        }),
      }),
      system:
        "You are a productivity strategist applying the Eisenhower Matrix. Reason carefully then output JSON only.",
      prompt: `TASKS:
${data.tasks.map((t, i) => `${i + 1}. ${t.title} — deadline: ${t.deadline || "none"} — notes: ${t.notes || ""}`).join("\n")}

STEPS:
1. Score each task by urgency + importance, assign quadrant + priority_score (0-100).
2. Suggest a concrete time slot today (e.g. "9:00-10:30").
3. Build a daily plan and a 3-bullet weekly focus.
4. Add 3 productivity recommendations tailored to the load.

JSON only.`,
    });
    return output;
  });

// ---------- Research Assistant ----------
const ResearchInput = z.object({ content: z.string().min(50) });

export const analyzeResearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          executive_summary: z.string(),
          key_insights: z.array(z.string()),
          risks: z.array(z.string()),
          recommendations: z.array(z.string()),
          next_steps: z.array(z.string()),
          confidence: z.number().min(0).max(100),
        }),
      }),
      system: "You are a McKinsey-grade analyst. Be specific, structured, evidence-grounded. JSON only.",
      prompt: `SOURCE CONTENT:
"""
${data.content}
"""

STEPS:
1. Summarize the source faithfully in 3-5 sentences.
2. Pull 4-6 key insights.
3. Identify 3 risks or blind spots.
4. Provide 3 concrete recommendations and 3 actionable next steps.
5. Rate confidence.

JSON only.`,
    });
    return output;
  });

// ---------- Quality Checker ----------
const QualityInput = z.object({ text: z.string().min(10) });

export const checkQuality = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => QualityInput.parse(d))
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          professionalism: z.number().min(0).max(100),
          clarity: z.number().min(0).max(100),
          completeness: z.number().min(0).max(100),
          overall: z.number().min(0).max(100),
          risks: z.array(z.string()),
          improvements: z.array(z.string()),
        }),
      }),
      system: "You are a strict editor evaluating AI-generated workplace output. Be candid. JSON only.",
      prompt: `EVALUATE THIS TEXT:
"""
${data.text}
"""

Score 0-100 each: professionalism, clarity, completeness, overall.
List risks (factual, tonal, legal) and concrete improvements. JSON only.`,
    });
    return output;
  });
