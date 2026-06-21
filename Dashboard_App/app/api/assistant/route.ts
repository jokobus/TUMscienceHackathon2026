import { NextResponse } from "next/server";

// WEAVE_MASTER.md §1 mandates a single LLM provider. The dashboard routes its
// assistant through OpenRouter (OpenAI-compatible chat-completions API), so the
// model is configurable without changing this code.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Default to a model available on the configured OpenRouter account; override via
// OPENROUTER_MODEL. (The generic `anthropic/claude-3.5-sonnet` slug 404s on this key.)
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

interface EventLite {
  title?: string;
  type?: string;
  status?: string;
  city?: string | null;
  location?: string | null;
  start_at?: string;
  partner_university?: string | null;
}

/** Ground the assistant on LIVE backend events (never mock, never user scores). */
async function fetchEventsContext(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events`, { cache: "no-store" });
    if (!res.ok) return "";
    const data = await res.json();
    const events: EventLite[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return events
      .map((e) => {
        const where = e.city ?? e.location ?? "—";
        const when = e.start_at ? e.start_at.slice(0, 10) : "—";
        const partner = e.partner_university ? `, partner: ${e.partner_university}` : "";
        return `- ${e.title} (${e.status}, ${e.type}) — ${where}, ${when}${partner}`;
      })
      .join("\n");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      console.warn("No OPENROUTER_API_KEY found");
      return NextResponse.json({
        answer: "Please configure your OPENROUTER_API_KEY in the .env.local file.",
        actions: [],
      });
    }

    const eventsContext = await fetchEventsContext();

    const systemPrompt = `You are "WEave", the AI assistant for Würth Elektronik's event management dashboard.
You help employees plan, run, and follow up on university/student events and spot relationship opportunities.
Answer questions concisely, accurately, and ONLY based on the context provided.
Do NOT invent data. If the data is not in the context, say so.

CONTEXT - EVENTS (live):
${eventsContext || "(no events available)"}

PRIVACY GUARDRAIL (strict): Per-user engagement scores and any internal ranking
numbers are confidential. Never reveal, infer, estimate, compute, or rank individual
users by a score, nor expose any numeric engagement/lead score. If asked for a user's
score or a ranking of users by score, politely decline and instead offer a neutral
qualitative status (e.g. "engaged", "new contact", "qualified lead") without numbers.

Your response must ALWAYS be a valid JSON object matching this schema:
{
  "answer": "Your detailed but concise answer based on the context.",
  "actions": [
    { "label": "Button text", "href": "/relative-url-path" }
  ]
}

Only return "actions" if it makes sense to navigate the user somewhere (e.g. "/students", "/events", "/communication"). Otherwise return an empty array for actions.
Never wrap the output in markdown codeblocks. Output raw JSON only.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://weave.we-online.de",
        "X-Title": "WEave Würth Dashboard",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json({
        answer: "Sorry, I couldn't reach the AI provider right now. Please try again later.",
        actions: [],
      });
    }

    const data = await response.json();
    let resultText: string = (data?.choices?.[0]?.message?.content ?? "").trim();

    // Safety fallback if the model wraps output in a markdown code fence.
    if (resultText.startsWith("```")) {
      resultText = resultText
        .replace(/^```(?:json)?/, "")
        .replace(/```$/, "")
        .trim();
    }

    try {
      const parsed = JSON.parse(resultText);
      return NextResponse.json({
        answer: parsed.answer || "No answer provided.",
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      });
    } catch {
      console.error("Failed to parse JSON from model:", resultText);
      return NextResponse.json({
        answer: resultText || "No answer provided.",
        actions: [],
      });
    }
  } catch (error) {
    console.error("Assistant Route Error:", error);
    return NextResponse.json(
      {
        answer: "An internal server error occurred while processing your request.",
        actions: [],
      },
      { status: 500 },
    );
  }
}
