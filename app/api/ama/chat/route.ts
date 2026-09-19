import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { requireAskMeAnythingAccess } from "@/lib/ama/access";
import { AMA_SYSTEM_PROMPT, createAmaTools } from "@/lib/ama/tools";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await requireAskMeAnythingAccess();
  if (!user) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.DATABASE_URL) {
    return new Response(
      JSON.stringify({ error: "Database is not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    const messages = body.messages ?? [];

    const result = streamText({
      model: process.env.AMA_MODEL ?? "openai/gpt-4o-mini",
      system: AMA_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: createAmaTools(user.email),
      stopWhen: stepCountIs(8),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AMA chat error:", error);
    const message =
      error instanceof Error ? error.message : "Ask Me Anything failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
