import { promises as fs } from "fs";
import path from "path";

export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "x"
  | "linkedin"
  | "pinterest";

export type PublishPayload = {
  jobId: string;
  videoPath: string;
  title: string;
  scriptSummary: string;
};

export type PublishResult = {
  platform: Platform;
  status: "success" | "error";
  detail?: string;
};

const PLATFORM_META: Record<
  Platform,
  { titleSuffix: string; hashtag: string; aspectRatio: string }
> = {
  youtube: {
    titleSuffix: " | Animated Explainer",
    hashtag: "#explainer #cartoon",
    aspectRatio: "16:9",
  },
  tiktok: {
    titleSuffix: " | TikTok Short",
    hashtag: "#fyp #cartoonstudio",
    aspectRatio: "9:16",
  },
  instagram: {
    titleSuffix: " | Reels Drop",
    hashtag: "#reels #motiondesign",
    aspectRatio: "9:16",
  },
  facebook: {
    titleSuffix: " | Community Launch",
    hashtag: "#brandstory #fanclub",
    aspectRatio: "4:5",
  },
  x: {
    titleSuffix: " | Micro Episode",
    hashtag: "#animate #NowPlaying",
    aspectRatio: "16:9",
  },
  linkedin: {
    titleSuffix: " | Pro Series",
    hashtag: "#leadership #innovation",
    aspectRatio: "1:1",
  },
  pinterest: {
    titleSuffix: " | Idea Pin",
    hashtag: "#creatorhub #tutorial",
    aspectRatio: "2:3",
  },
};

export async function publishToPlatforms(
  platforms: Platform[],
  payload: PublishPayload
): Promise<PublishResult[]> {
  const tasks = platforms.map((platform) =>
    simulatePlatformUpload(platform, payload)
  );
  return Promise.all(tasks);
}

async function simulatePlatformUpload(
  platform: Platform,
  payload: PublishPayload
): Promise<PublishResult> {
  const meta = PLATFORM_META[platform];
  const outputDir = path.join(process.cwd(), "public", "generated", payload.jobId);
  await fs.mkdir(outputDir, { recursive: true });

  const simulatedLatency = randomBetween(600, 1600);
  await new Promise((resolve) => setTimeout(resolve, simulatedLatency));

  const record = {
    jobId: payload.jobId,
    platform,
    title: `${payload.title}${meta.titleSuffix}`,
    caption: `${payload.scriptSummary} ${meta.hashtag}`,
    aspectRatio: meta.aspectRatio,
    source: payload.videoPath,
    uploadedAt: new Date().toISOString(),
  };

  const recordPath = path.join(outputDir, `${platform}.json`);
  await fs.writeFile(recordPath, JSON.stringify(record, null, 2), "utf8");

  return {
    platform,
    status: "success",
    detail: `Metadata packaged (${meta.aspectRatio}) & scheduled (${simulatedLatency}ms).`,
  };
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
