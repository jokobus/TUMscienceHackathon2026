import { NextResponse } from "next/server";
import { MOCK_EVENTS, MOCK_STUDENTS } from "@/lib/mockData";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      console.warn("No OpenRouter API key found");
      return NextResponse.json({
        answer: "Please configure your OpenRouter API Key in the .env.local file.",
        actions: []
      });
    }

    // Build context
    const eventsContext = MOCK_EVENTS.map(e => 
      `- ${e.title} (${e.status}, ${e.type}): ROI: ${e.relationship_roi}, Attendees: ${e.attendee_count}, KPIs: ${e.kpis ? `Reg: ${e.kpis.registered}, Checked-in: ${e.kpis.checked_in}` : 'N/A'}`
    ).join("\n");

    const studentsContext = MOCK_STUDENTS.map(s => 
      `- ${s.display_name} (${s.university}, ${s.study_degree}): Score: ${s.engagement_score}, Status: ${s.interaction_status}, Leads: ${s.lead_status}`
    ).join("\n");

    const systemPrompt = `You are "WEave", the AI assistant for Würth Elektronik's event management dashboard.
You must answer questions concisely, accurately, and ONLY based on the context provided.
Do NOT invent data. If the data is not in the context, say so.

CONTEXT - EVENTS:
${eventsContext}

CONTEXT - STUDENTS:
${studentsContext}

Your response must ALWAYS be a valid JSON object matching this schema:
{
  "answer": "Your detailed but concise answer based on the context.",
  "actions": [
    { "label": "Button text", "href": "/relative-url-path" }
  ]
}

Only return "actions" if it makes sense to navigate the user somewhere (e.g. "/students", "/events", "/communication"). Otherwise return an empty array for actions.
Never wrap the output in markdown codeblocks (no \`\`\`json). Output raw JSON.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json({
        answer: "Sorry, I couldn't reach the AI provider right now. Please try again later.",
        actions: []
      });
    }

    const data = await response.json();
    let resultText = data.choices[0].message.content.trim();
    
    // Safety fallback if model includes markdown wrappers
    if (resultText.startsWith("\`\`\`json")) {
      resultText = resultText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (resultText.startsWith("\`\`\`")) {
      resultText = resultText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    try {
      const parsed = JSON.parse(resultText);
      return NextResponse.json({
        answer: parsed.answer || "No answer provided.",
        actions: Array.isArray(parsed.actions) ? parsed.actions : []
      });
    } catch (parseError) {
      console.error("Failed to parse JSON from model:", resultText);
      return NextResponse.json({
        answer: resultText,
        actions: []
      });
    }

  } catch (error) {
    console.error("Assistant Route Error:", error);
    return NextResponse.json({
      answer: "An internal server error occurred while processing your request.",
      actions: []
    }, { status: 500 });
  }
}
