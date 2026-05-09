import { isInDefaultScale } from "@/lib/music";

type GeneratedNote = {
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
};

type GeneratedPattern = {
  name: string;
  notes: GeneratedNote[];
};

const TOTAL_STEPS = 512;
const D_MINOR_PITCHES = [50, 52, 53, 55, 57, 58, 60, 62, 64, 65, 67, 69, 70, 72];
const DRUM_PITCHES = new Set([48, 50, 54]);

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({
      patterns: localGeneratedPatterns(prompt ?? "lo-fi jazz in D minor"),
      source: "local",
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You generate quantized DAW piano-roll patterns. Return JSON only. Use 1/16-note steps, D minor by default, and fit within 512 steps.",
        },
        {
          role: "user",
          content: `Generate three reusable patterns for: ${prompt ?? "lo-fi jazz in D minor"}.
Return one melody pattern, one chord progression pattern, and one basic drum pattern.
Melody and chord pitches must be MIDI D minor scale tones from 50 to 72.
Drum pattern must use pitch 48 for kick, 50 for snare, and 54 for hi-hat.
Every note must have integer startTime, integer duration, and velocity from 0.1 to 1.`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "generated_patterns",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["patterns"],
            properties: {
              patterns: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "notes"],
                  properties: {
                    name: { type: "string" },
                    notes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["pitch", "startTime", "duration", "velocity"],
                        properties: {
                          pitch: { type: "integer", minimum: 48, maximum: 72 },
                          startTime: { type: "integer", minimum: 0, maximum: 511 },
                          duration: { type: "integer", minimum: 1, maximum: 64 },
                          velocity: { type: "number", minimum: 0.1, maximum: 1 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    return Response.json(
      { patterns: localGeneratedPatterns(prompt ?? "lo-fi jazz in D minor"), source: "local" },
      { status: 200 },
    );
  }

  const data = await response.json();
  const parsed = JSON.parse(data.output_text ?? "{}") as { patterns?: GeneratedPattern[] };

  return Response.json({
    patterns: normalizePatterns(parsed.patterns ?? []),
    source: "openai",
  });
}

function normalizePatterns(patterns: GeneratedPattern[]) {
  const normalized = patterns.slice(0, 3).map((pattern, index) => ({
    name: pattern.name || ["AI Melody", "AI Chords", "AI Drums"][index],
    notes: pattern.notes
      .map((note) => ({
        pitch: clamp(Math.round(note.pitch), 48, 72),
        startTime: clamp(Math.round(note.startTime), 0, TOTAL_STEPS - 1),
        duration: clamp(Math.round(note.duration), 1, 64),
        velocity: clamp(note.velocity, 0.1, 1),
      }))
      .filter((note, noteIndex) => {
        if (index === 2) return DRUM_PITCHES.has(note.pitch) && noteIndex < 128;
        return isInDefaultScale(note.pitch) && noteIndex < 96;
      }),
  }));

  return normalized.length ? normalized : localGeneratedPatterns("D minor idea");
}

function localGeneratedPatterns(prompt: string): GeneratedPattern[] {
  const airy = /lo-fi|jazz|soft|chill/i.test(prompt);
  const melodySteps = [0, 4, 8, 12, 18, 24, 28, 32, 40, 44, 48, 56];
  const melody = melodySteps.map((startTime, index) => ({
    pitch: D_MINOR_PITCHES[(index * 2 + (airy ? 3 : 0)) % D_MINOR_PITCHES.length],
    startTime,
    duration: index % 3 === 0 ? 3 : 2,
    velocity: index % 4 === 0 ? 0.88 : 0.72,
  }));

  const chordRoots = [50, 57, 58, 53];
  const chords = chordRoots.flatMap((root, index) =>
    [root, root + 3, root + 7]
      .filter((pitch) => pitch <= 72 && isInDefaultScale(pitch))
      .map((pitch) => ({
        pitch,
        startTime: index * 16,
        duration: 14,
        velocity: 0.68,
      })),
  );

  const drums = Array.from({ length: 64 }, (_, step) => step).flatMap((step) => {
    const notes: GeneratedNote[] = [];
    if (step % 16 === 0 || step % 16 === 10) {
      notes.push({ pitch: 48, startTime: step, duration: 1, velocity: 0.92 });
    }
    if (step % 16 === 4 || step % 16 === 12) {
      notes.push({ pitch: 50, startTime: step, duration: 1, velocity: 0.78 });
    }
    if (step % 2 === 0) {
      notes.push({ pitch: 54, startTime: step, duration: 1, velocity: 0.45 });
    }
    return notes;
  });

  return [
    { name: "AI Melody", notes: melody },
    { name: "AI Chords", notes: chords },
    { name: "AI Drums", notes: drums },
  ];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
