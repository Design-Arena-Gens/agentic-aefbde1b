import { NextResponse } from "next/server";
import { z } from "zod";
import { generateCartoonVideo } from "@/lib/generator";
import { publishToPlatforms } from "@/lib/social";

export const runtime = "nodejs";

const requestSchema = z.object({
  title: z.string().min(3).max(120),
  script: z.string().min(10),
  style: z.string().min(3).max(40),
  palette: z.array(z.string()).min(1).max(8),
  platforms: z
    .array(
      z.enum([
        "youtube",
        "tiktok",
        "instagram",
        "facebook",
        "x",
        "linkedin",
        "pinterest",
      ])
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, script, style, palette, platforms } = requestSchema.parse(body);

    const generation = await generateCartoonVideo({
      title,
      script,
      style,
      palette,
    });

    const publishResults = await publishToPlatforms(platforms, {
      jobId: generation.jobId,
      title,
      scriptSummary: summarizeScript(script),
      videoPath: generation.publicUrl,
    });

    return NextResponse.json({
      jobId: generation.jobId,
      videoUrl: generation.publicUrl,
      frameCount: generation.frameCount,
      timeline: generation.timeline,
      publish: publishResults.map((item) => ({
        platform: item.platform,
        status: item.status,
        detail: item.detail,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("[generate] failure", error);
    return NextResponse.json(
      { error: "Failed to generate or publish the cartoon video." },
      { status: 500 }
    );
  }
}

function summarizeScript(script: string) {
  const text = script.replace(/\s+/g, " ").trim();
  if (text.length <= 180) return text;
  return `${text.slice(0, 177)}...`;
}
