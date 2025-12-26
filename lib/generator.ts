import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { createCanvas } from "@napi-rs/canvas";
import type { CanvasRenderingContext2D } from "@napi-rs/canvas";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 24;
const SCENE_DURATION_SECONDS = 3;

export type TimelineEntry = {
  label: string;
  detail?: string;
  completed: boolean;
};

export type GenerateOptions = {
  title: string;
  script: string;
  palette: string[];
  style: string;
};

export type GenerationResult = {
  jobId: string;
  timeline: TimelineEntry[];
  videoPath: string;
  publicUrl: string;
  frameCount: number;
};

type Scene = {
  text: string;
  index: number;
  total: number;
};

export async function generateCartoonVideo(
  options: GenerateOptions
): Promise<GenerationResult> {
  const jobId = uuidv4();
  const timeline: TimelineEntry[] = [
    {
      label: "Storyboard synthesized",
      detail: "Parsing script into animated scenes.",
      completed: false,
    },
    {
      label: "Frames rendered",
      detail: "Painting cartoon frames with motion paths.",
      completed: false,
    },
    {
      label: "Video authored",
      detail: "Encoding HD master and prepping metadata.",
      completed: false,
    },
  ];

  const palette = normalizePalette(options.palette);
  const scenes = buildScenes(options.script);
  timeline[0]!.detail = `Identified ${scenes.length} scenes for ${options.style} style.`;
  timeline[0]!.completed = true;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `cartoon-${jobId}-`));
  const frameDir = path.join(tempDir, "frames");
  await fs.mkdir(frameDir, { recursive: true });

  const framesPerScene = FPS * SCENE_DURATION_SECONDS;
  const totalFrames = framesPerScene * scenes.length;

  await renderFrames({
    scenes,
    frameDir,
    palette,
    title: options.title,
    framesPerScene,
  });
  timeline[1]!.detail = `Rendered ${totalFrames} frames at ${FPS} fps.`;
  timeline[1]!.completed = true;

  const publicDir = path.join(process.cwd(), "public", "generated");
  await fs.mkdir(publicDir, { recursive: true });
  const videoPath = path.join(publicDir, `${jobId}.mp4`);

  await encodeVideo({
    frameDir,
    outputPath: videoPath,
    fps: FPS,
  });
  timeline[2]!.detail = ".mp4 master ready for multi-channel distribution.";
  timeline[2]!.completed = true;

  await fs.rm(tempDir, { recursive: true, force: true });

  return {
    jobId,
    timeline,
    videoPath,
    publicUrl: `/generated/${path.basename(videoPath)}`,
    frameCount: totalFrames,
  };
}

async function renderFrames({
  scenes,
  frameDir,
  palette,
  title,
  framesPerScene,
}: {
  scenes: Scene[];
  frameDir: string;
  palette: string[];
  title: string;
  framesPerScene: number;
}) {
  let frameIndex = 0;

  for (const scene of scenes) {
    for (let localIndex = 0; localIndex < framesPerScene; localIndex++) {
      const progress = localIndex / (framesPerScene - 1);
      const canvas = createCanvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext("2d");

      paintBackground(ctx, palette, scene, progress);
      paintCharacters(ctx, palette, scene, progress);
      paintTitle(ctx, title);
      paintSceneText(ctx, scene.text, palette, progress);
      paintHUD(ctx, scene, progress);

      const fileName = `frame_${String(frameIndex + 1).padStart(4, "0")}.png`;
      const filePath = path.join(frameDir, fileName);
      const buffer = await canvas.encode("png");
      await fs.writeFile(filePath, buffer);

      frameIndex += 1;
    }
  }
}

async function encodeVideo({
  frameDir,
  outputPath,
  fps,
}: {
  frameDir: string;
  outputPath: string;
  fps: number;
}) {
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .addInput(path.join(frameDir, "frame_%04d.png"))
      .inputFPS(fps)
      .withVideoCodec("libx264")
      .outputOptions([
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        "-vf",
        `scale=${WIDTH}:${HEIGHT}`,
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (error) => reject(error))
      .run();
  });
}

function normalizePalette(palette: string[]): string[] {
  const sanitized = palette
    .map((hex) => sanitizeHex(hex))
    .filter((hex): hex is string => Boolean(hex));

  if (sanitized.length >= 3) {
    return sanitized;
  }

  return ["#38BDF8", "#FACC15", "#F472B6", "#A855F7"];
}

function sanitizeHex(hex: string | undefined | null): string | null {
  if (!hex) return null;
  const cleaned = hex.trim();
  if (!/^#?[0-9A-Fa-f]{3,6}$/.test(cleaned)) return null;
  return cleaned.startsWith("#") ? cleaned.toUpperCase() : `#${cleaned.toUpperCase()}`;
}

function buildScenes(script: string): Scene[] {
  const fragments = script
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])/))
    .map((fragment) => fragment.trim())
    .filter(Boolean);

  const safeFragments = fragments.length > 0 ? fragments : ["Introduce the brand hero.", "Showcase the top features.", "Call fans to action with energy."];

  return safeFragments.map((text, index) => ({
    text,
    index,
    total: safeFragments.length,
  }));
}

function paintBackground(
  ctx: CanvasRenderingContext2D,
  palette: string[],
  scene: Scene,
  progress: number
) {
  const base = palette[scene.index % palette.length]!;
  const accent = palette[(scene.index + 1) % palette.length]!;
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, tweakColor(base, 0.1));
  gradient.addColorStop(1, tweakColor(accent, -0.15));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = tweakColor(accent, 0.2);
  const waveCount = 4;
  for (let wave = 0; wave < waveCount; wave++) {
    const offset = (progress * Math.PI * 2 + wave * 1.2) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT * (0.2 + wave * 0.2));
    for (let x = 0; x <= WIDTH; x += 20) {
      const y =
        HEIGHT * (0.2 + wave * 0.2) +
        Math.sin(offset + (x / WIDTH) * Math.PI * 4) * 40;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function paintCharacters(
  ctx: CanvasRenderingContext2D,
  palette: string[],
  scene: Scene,
  progress: number
) {
  const botBody = palette[(scene.index + 2) % palette.length]!;
  const botAccent = palette[(scene.index + 1) % palette.length]!;

  const centerX = WIDTH * 0.25;
  const centerY = HEIGHT * 0.6;
  const floatOffset = Math.sin(progress * Math.PI * 2) * 16;

  ctx.save();
  ctx.translate(centerX, centerY + floatOffset);

  ctx.fillStyle = botBody;
  ctx.beginPath();
  ctx.ellipse(0, 0, 110, 140, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.ellipse(0, -20, 70, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = botAccent;
  ctx.beginPath();
  ctx.arc(-25, -30, 18, 0, Math.PI * 2);
  ctx.arc(25, -30, 18, 0, Math.PI * 2);
  ctx.fill("evenodd");

  ctx.lineWidth = 8;
  ctx.strokeStyle = botAccent;
  ctx.beginPath();
  ctx.moveTo(-70, 0);
  ctx.quadraticCurveTo(-120, -40, -140, -10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, 0);
  ctx.quadraticCurveTo(120, -40, 140, -10);
  ctx.stroke();

  ctx.restore();
}

function paintTitle(
  ctx: CanvasRenderingContext2D,
  title: string
) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
  ctx.font = "700 56px 'Inter', 'Arial Rounded MT Bold', sans-serif";
  ctx.fillText(title, WIDTH / 2, HEIGHT * 0.18);
  ctx.restore();
}

function paintSceneText(
  ctx: CanvasRenderingContext2D,
  text: string,
  palette: string[],
  progress: number
) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = "600 40px 'Inter', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";

  const lines = wrapText(ctx, text, WIDTH * 0.5);
  const baseY = HEIGHT * 0.42;
  lines.forEach((line, index) => {
    const offset = Math.sin(progress * Math.PI * 2 + index * 0.5) * 12;
    ctx.fillText(line, WIDTH * 0.45, baseY + index * 48 + offset);
  });

  ctx.strokeStyle = palette[0]!;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(WIDTH * 0.45, baseY - 60);
  ctx.lineTo(WIDTH * 0.85, baseY - 60);
  ctx.stroke();
  ctx.restore();
}

function paintHUD(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  progress: number
) {
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
  drawRoundedRect(ctx, 48, 48, 240, 80, 20);

  ctx.fillStyle = "#F8FAFC";
  ctx.font = "700 26px 'Inter', sans-serif";
  ctx.fillText(`Scene ${scene.index + 1}/${scene.total}`, 72, 96);
  ctx.font = "600 18px 'Inter', sans-serif";
  ctx.fillText(`${Math.round(progress * 100)}% animated`, 72, 124);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const tentative = current ? `${current} ${word}` : word;
    if (ctx.measureText(tentative).width <= maxWidth) {
      current = tentative;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function tweakColor(hex: string, delta: number) {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value + delta * 255)));
  return `rgb(${adjust(r)}, ${adjust(g)}, ${adjust(b)})`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
    : normalized;
  const int = parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
