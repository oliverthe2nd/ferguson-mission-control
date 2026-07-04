import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprover } from "@/lib/auth";
import { reviewSubmission } from "@/lib/submissions";

const reviewBodySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  comment: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await requireApprover();
  if (!user) {
    return NextResponse.json({ error: "Approver access required" }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const body = reviewBodySchema.parse(await request.json());
    const submission = await reviewSubmission({
      id,
      decision: body.decision,
      reviewerName: user.name,
      reviewerEmail: user.email,
      comment: body.comment,
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Review error:", error);
    return NextResponse.json({ error: "Review failed" }, { status: 500 });
  }
}
