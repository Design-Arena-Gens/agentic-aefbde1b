"use client";

import { FormEvent, useMemo, useState } from "react";

type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "x"
  | "linkedin"
  | "pinterest";

type PublishStatus = {
  platform: Platform;
  status: "pending" | "success" | "error";
  detail?: string;
};

type GenerationResponse = {
  videoUrl: string;
  jobId: string;
  timeline: Array<{ label: string; completed: boolean; detail?: string }>;
  publish: PublishStatus[];
};

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram Reels",
  facebook: "Facebook",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  pinterest: "Pinterest Idea Pins",
};

const PRESETS = [
  {
    name: "Product Explainer",
    script:
      "Meet Pixel, the friendly robot who unlocks your creative superpowers! In section one, Pixel introduces the hero product. In section two, Pixel demonstrates the top three features with playful animations. In section three, Pixel invites the audience to try a quick challenge and share it online.",
  },
  {
    name: "Weekly Announcement",
    script:
      "Welcome back to the studio! Today in scene one, we highlight the biggest win of the week with a joyful animation. Scene two delivers three fast updates with bold captions. Scene three closes with an energetic call to action reminding the audience to stay tuned.",
  },
];

export default function Page() {
  const [script, setScript] = useState(PRESETS[0]!.script);
  const [title, setTitle] = useState("Meet Pixel: Your Creative Robo-Buddy");
  const [style, setStyle] = useState("playful");
  const [palette, setPalette] = useState("#38bdf8,#facc15,#f472b6");
  const [platforms, setPlatforms] = useState<Platform[]>([
    "youtube",
    "tiktok",
    "instagram",
  ]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const palettePreview = useMemo(() => {
    return palette
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }, [palette]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!script.trim()) {
      setError("Please provide a script so the agent knows what to animate.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          title,
          style,
          palette: palettePreview,
          platforms,
        }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.error ?? "Unexpected error during generation.");
      }

      const data = (await res.json()) as GenerationResponse;
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function togglePlatform(platform: Platform) {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((item) => item !== platform)
        : [...prev, platform]
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>Cartoon Launch Agent</h1>
        <p>
          Generate stylized cartoon explainers and dispatch them to every social
          channel in one go. Drop your script, pick your vibe, click run.
        </p>
        <div className="palette-preview">
          {palettePreview.map((hex) => (
            <span key={hex} style={{ backgroundColor: hex }} />
          ))}
        </div>
      </section>

      <section className="content">
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Video Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="The catchy headline for your cartoon"
              required
            />
          </div>

          <div className="field">
            <label>Creative Script</label>
            <textarea
              value={script}
              onChange={(event) => setScript(event.target.value)}
              rows={8}
              placeholder="Scene-by-scene instructions for the agent to animate."
            />
          </div>

          <div className="field">
            <label>Style Keyword</label>
            <input
              value={style}
              onChange={(event) => setStyle(event.target.value)}
              placeholder="playful, neon, pastel, cinematic..."
            />
          </div>

          <div className="field">
            <label>Palette</label>
            <input
              value={palette}
              onChange={(event) => setPalette(event.target.value)}
              placeholder="#38bdf8,#facc15,#f472b6"
            />
          </div>

          <div className="field">
            <label>Distribution</label>
            <div className="platform-list">
              {(Object.keys(PLATFORM_LABELS) as Platform[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePlatform(key)}
                  className={platforms.includes(key) ? "platform active" : "platform"}
                >
                  {PLATFORM_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Quick Presets</label>
            <div className="preset-row">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setScript(preset.script)}
                  className="preset"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <button className="submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Generating + Publishing..." : "Generate & Publish"}
          </button>

          {error && <p className="error">{error}</p>}
        </form>

        <aside className="status">
          <h2>Automation Timeline</h2>
          {!response ? (
            <ul className="timeline">
              <li className="timeline-item">
                <span className="dot" />
                <div>
                  <h3>Blueprint</h3>
                  <p>We analyze the script, split it into scenes, and choose motion paths.</p>
                </div>
              </li>
              <li className="timeline-item">
                <span className="dot" />
                <div>
                  <h3>Rendering</h3>
                  <p>We paint each frame with the palette you provided and produce an HD video.</p>
                </div>
              </li>
              <li className="timeline-item">
                <span className="dot" />
                <div>
                  <h3>Publishing</h3>
                  <p>We resize, caption, and post to every selected platform with optimized metadata.</p>
                </div>
              </li>
            </ul>
          ) : (
            <>
              <ul className="timeline">
                {response.timeline.map((item) => (
                  <li
                    key={item.label}
                    className={
                      item.completed ? "timeline-item completed" : "timeline-item"
                    }
                  >
                    <span className="dot" />
                    <div>
                      <h3>{item.label}</h3>
                      {item.detail && <p>{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="video-card">
                <video src={response.videoUrl} controls playsInline />
                <a className="download" href={response.videoUrl} download>
                  Download Master Video
                </a>
              </div>
              <div className="publish-results">
                {response.publish.map((item) => (
                  <div
                    key={item.platform}
                    className={
                      item.status === "success"
                        ? "result success"
                        : item.status === "error"
                        ? "result error"
                        : "result"
                    }
                  >
                    <strong>{PLATFORM_LABELS[item.platform]}</strong>
                    <span>{item.status.toUpperCase()}</span>
                    {item.detail && <p>{item.detail}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}
