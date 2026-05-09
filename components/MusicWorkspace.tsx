"use client";

import { useCallback, useMemo, useState } from "react";
import PianoRoll from "@/components/PianoRoll";
import { PianoRollNote, useTonePlayback } from "@/hooks/useTonePlayback";
import {
  DEFAULT_SCALE_NAME,
  DEFAULT_SCALE_ROOT,
  getScaleChordPitches,
  isInDefaultScale,
} from "@/lib/music";

const BARS = 32;
const STEPS_PER_BAR = 16;
const TOTAL_STEPS = BARS * STEPS_PER_BAR;
const BPM = 110;
const DEFAULT_DURATION = 1;
const DEFAULT_VELOCITY = 0.8;

type Pattern = {
  id: string;
  name: string;
  notes: PianoRollNote[];
};

type PlaybackMode = "pattern" | "arrangement";

const DEFAULT_PATTERN: Pattern = {
  id: "pattern-idea-1",
  name: "Idea 1",
  notes: [],
};

export default function MusicWorkspace() {
  const [patterns, setPatterns] = useState<Pattern[]>([DEFAULT_PATTERN]);
  const [selectedPatternId, setSelectedPatternId] = useState(DEFAULT_PATTERN.id);
  const [arrangement, setArrangement] = useState<string[]>([DEFAULT_PATTERN.id]);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("pattern");
  const [scaleLock, setScaleLock] = useState(true);
  const [chordPreview, setChordPreview] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("lo-fi jazz in D minor");
  const [aiStatus, setAiStatus] = useState("Ready");

  const selectedPattern = patterns.find((pattern) => pattern.id === selectedPatternId) ?? patterns[0];
  const arrangementNotes = useMemo(
    () =>
      arrangement.flatMap((patternId, index) => {
        const pattern = patterns.find((item) => item.id === patternId);
        if (!pattern) return [];

        return pattern.notes.map((note) => ({
          ...note,
          id: `${index}-${note.id}`,
          startTime: note.startTime + index * TOTAL_STEPS,
        }));
      }),
    [arrangement, patterns],
  );
  const playbackNotes = playbackMode === "arrangement" ? arrangementNotes : selectedPattern.notes;
  const playbackSteps =
    playbackMode === "arrangement"
      ? Math.max(TOTAL_STEPS, arrangement.length * TOTAL_STEPS)
      : TOTAL_STEPS;

  const { isPlaying, playhead, play, toggle, stop } = useTonePlayback({
    notes: playbackNotes,
    bpm: BPM,
    totalSteps: playbackSteps,
  });
  const editorPlayhead =
    isPlaying && playhead !== null ? playhead % TOTAL_STEPS : playhead;

  const updateSelectedPatternNotes = useCallback((
    updater: (current: PianoRollNote[]) => PianoRollNote[],
  ) => {
    setPatterns((current) =>
      current.map((pattern) =>
        pattern.id === selectedPattern.id
          ? { ...pattern, notes: updater(pattern.notes) }
          : pattern,
      ),
    );
  }, [selectedPattern.id]);

  const toggleNote = useCallback((pitch: number, startTime: number) => {
    if (scaleLock && !isInDefaultScale(pitch)) return;

    const pitches = chordPreview ? getScaleChordPitches(pitch) : [pitch];

    updateSelectedPatternNotes((current) => {
      const keys = new Set(pitches.map((notePitch) => cellKey(notePitch, startTime)));
      const shouldRemove = current.some((note) => keys.has(note.id));

      if (shouldRemove) {
        return current.filter((note) => !keys.has(note.id));
      }

      return [
        ...current,
        ...pitches.map((notePitch) => ({
          id: cellKey(notePitch, startTime),
          pitch: notePitch,
          startTime,
          duration: DEFAULT_DURATION,
          velocity: DEFAULT_VELOCITY,
        })),
      ];
    });
  }, [chordPreview, scaleLock, updateSelectedPatternNotes]);

  function clearNotes() {
    stop();
    updateSelectedPatternNotes(() => []);
  }

  function createPattern() {
    const id = `pattern-${patterns.length + 1}`;
    const pattern = {
      id,
      name: `Idea ${patterns.length + 1}`,
      notes: [],
    };

    setPatterns((current) => [...current, pattern]);
    setArrangement((current) => [...current, id]);
    setSelectedPatternId(id);
    setPlaybackMode("pattern");
  }

  function deleteSelectedPattern() {
    if (patterns.length === 1) return;

    const remaining = patterns.filter((pattern) => pattern.id !== selectedPattern.id);
    const fallbackId = remaining[0].id;

    setPatterns(remaining);
    setArrangement((current) => {
      const next = current.filter((patternId) => patternId !== selectedPattern.id);
      return next.length ? next : [fallbackId];
    });
    setSelectedPatternId(fallbackId);
    setPlaybackMode("pattern");
  }

  function renameSelectedPattern(name: string) {
    setPatterns((current) =>
      current.map((pattern) =>
        pattern.id === selectedPattern.id ? { ...pattern, name } : pattern,
      ),
    );
  }

  function playPattern() {
    if (isPlaying && playbackMode === "pattern") {
      toggle();
      return;
    }

    setPlaybackMode("pattern");
    window.setTimeout(() => void play(), 0);
  }

  function playArrangement() {
    if (isPlaying && playbackMode === "arrangement") {
      toggle();
      return;
    }

    setPlaybackMode("arrangement");
    window.setTimeout(() => void play(), 0);
  }

  function addSelectedToArrangement() {
    setArrangement((current) => [...current, selectedPattern.id]);
  }

  function removeArrangementItem(index: number) {
    setArrangement((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [selectedPattern.id];
    });
  }

  async function generateIdea() {
    setAiStatus("Generating");
    stop();

    try {
      const response = await fetch("/api/generate-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = (await response.json()) as {
        patterns: Array<{ name: string; notes: Omit<PianoRollNote, "id">[] }>;
        source: "openai" | "local";
      };
      const stamp = Date.now().toString(36);
      const generatedPatterns = data.patterns.map((pattern, patternIndex) => ({
        id: `ai-${stamp}-${patternIndex}`,
        name: pattern.name,
        notes: pattern.notes.map((note, noteIndex) => ({
          ...note,
          id: `ai-${stamp}-${patternIndex}-${noteIndex}`,
        })),
      }));

      if (!generatedPatterns.length) throw new Error("No patterns returned");

      setPatterns((current) => [...current, ...generatedPatterns]);
      setArrangement((current) => [
        ...current,
        ...generatedPatterns.map((pattern) => pattern.id),
      ]);
      setSelectedPatternId(generatedPatterns[0].id);
      setPlaybackMode("pattern");
      setAiStatus(data.source === "openai" ? "Generated" : "Generated locally");
      window.setTimeout(() => void play(), 0);
    } catch {
      setAiStatus("Generation failed");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] p-4 text-[#171717] md:p-6">
      <section id="piano-roll" className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-[#d5ddd8] pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#356b63]">
              Piano Roll
            </p>
            <h1 className="text-2xl font-semibold">Grid Sequencer</h1>
            <p className="mt-1 text-sm text-[#56635f]">
              Edit reusable patterns, then play a simple arrangement in order.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[#d5ddd8] bg-white px-3 py-2 text-sm">
              {BPM} BPM
            </span>
            <span className="rounded-md border border-[#d5ddd8] bg-white px-3 py-2 text-sm">
              {BARS} bars
            </span>
            <span className="rounded-md border border-[#d5ddd8] bg-white px-3 py-2 text-sm">
              {selectedPattern.notes.length} notes
            </span>
            <label className="roll-toggle">
              <input
                type="checkbox"
                checked={scaleLock}
                onChange={(event) => setScaleLock(event.target.checked)}
              />
              {DEFAULT_SCALE_ROOT} {DEFAULT_SCALE_NAME}
            </label>
            <label className="roll-toggle">
              <input
                type="checkbox"
                checked={chordPreview}
                onChange={(event) => setChordPreview(event.target.checked)}
              />
              Chords
            </label>
            <button className="roll-action primary" onClick={playPattern}>
              {isPlaying && playbackMode === "pattern" ? "Stop" : "Play Pattern"}
            </button>
            <button className="roll-action" onClick={playArrangement}>
              {isPlaying && playbackMode === "arrangement" ? "Stop" : "Play Arrangement"}
            </button>
            <button className="roll-action" onClick={clearNotes}>
              Clear
            </button>
          </div>
        </header>

        <div className="structure-grid">
          <section className="structure-panel">
            <div className="structure-heading">
              <h2>Patterns</h2>
              <button className="roll-action" onClick={createPattern}>
                New
              </button>
            </div>
            <div className="pattern-controls">
              <select
                value={selectedPattern.id}
                onChange={(event) => {
                  setSelectedPatternId(event.target.value);
                  setPlaybackMode("pattern");
                }}
                aria-label="Pattern selector"
              >
                {patterns.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name}
                  </option>
                ))}
              </select>
              <input
                value={selectedPattern.name}
                onChange={(event) => renameSelectedPattern(event.target.value)}
                aria-label="Pattern name"
              />
              <button
                className="roll-action"
                onClick={deleteSelectedPattern}
                disabled={patterns.length === 1}
              >
                Delete
              </button>
            </div>
          </section>

          <section className="structure-panel">
            <div className="structure-heading">
              <h2>Arrangement</h2>
              <button className="roll-action" onClick={addSelectedToArrangement}>
                Add Selected
              </button>
            </div>
            <ol className="arrangement-list">
              {arrangement.map((patternId, index) => {
                const pattern = patterns.find((item) => item.id === patternId);
                return (
                  <li key={`${patternId}-${index}`}>
                    <span>{pattern?.name ?? "Missing Pattern"}</span>
                    <button onClick={() => removeArrangementItem(index)}>Remove</button>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <section className="structure-panel ai-panel">
          <div className="structure-heading">
            <div>
              <h2>AI Idea Generator</h2>
              <p>{aiStatus}</p>
            </div>
            <button
              className="roll-action primary"
              onClick={generateIdea}
              disabled={aiStatus === "Generating"}
            >
              Generate Idea
            </button>
          </div>
          <input
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            placeholder="lo-fi jazz in D minor"
            aria-label="AI music prompt"
          />
        </section>

        <PianoRoll
          notes={selectedPattern.notes}
          totalSteps={TOTAL_STEPS}
          playhead={editorPlayhead}
          scaleLock={scaleLock}
          onToggleNote={toggleNote}
        />
      </section>
    </main>
  );
}

function cellKey(pitch: number, startTime: number) {
  return `note-${pitch}-${startTime}`;
}
