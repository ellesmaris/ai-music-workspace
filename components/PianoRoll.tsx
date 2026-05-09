"use client";

import { memo, useMemo } from "react";
import type { CSSProperties } from "react";
import { PianoRollNote } from "@/hooks/useTonePlayback";
import { PITCHES, isInDefaultScale, pitchToName } from "@/lib/music";
import NoteBlock from "@/components/NoteBlock";
import Playhead from "@/components/Playhead";

const STEP_WIDTH = 28;
const ROW_HEIGHT = 26;
const LABEL_WIDTH = 72;

type PianoRollProps = {
  notes: PianoRollNote[];
  totalSteps: number;
  playhead: number | null;
  scaleLock: boolean;
  onToggleNote: (pitch: number, startTime: number) => void;
};

export default function PianoRoll({
  notes,
  totalSteps,
  playhead,
  scaleLock,
  onToggleNote,
}: PianoRollProps) {
  const rollWidth = totalSteps * STEP_WIDTH;
  const rollHeight = PITCHES.length * ROW_HEIGHT;

  const timeLabels = useMemo(
    () => Array.from({ length: totalSteps }, (_, step) => step),
    [totalSteps],
  );

  return (
    <div
      className="piano-roll-editor"
      style={
        {
          "--step-width": `${STEP_WIDTH}px`,
          "--row-height": `${ROW_HEIGHT}px`,
          "--label-width": `${LABEL_WIDTH}px`,
        } as CSSProperties
      }
    >
      <div className="roll-time-row">
        <div className="roll-corner" />
        <div
          className="time-grid"
          style={{
            width: rollWidth,
            gridTemplateColumns: `repeat(${totalSteps}, var(--step-width))`,
          }}
        >
          {timeLabels.map((step) => (
            <div
              key={step}
              className={["time-label", step % 4 === 0 ? "beat" : ""].join(" ")}
            >
              {step % 16 === 0 ? `${step / 16 + 1}` : step % 4 === 0 ? step + 1 : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="roll-body">
        <div className="pitch-column">
          {PITCHES.map((pitch) => (
            <div className="pitch-label" key={pitch}>
              {pitchToName(pitch)}
            </div>
          ))}
        </div>

        <div className="roll-surface" style={{ width: rollWidth, height: rollHeight }}>
          <GridCells
            totalSteps={totalSteps}
            scaleLock={scaleLock}
            onToggleNote={onToggleNote}
          />
          <div className="note-layer" aria-hidden="true">
            {notes.map((note) => (
              <NoteBlock
                key={note.id}
                note={note}
                stepWidth={STEP_WIDTH}
                rowHeight={ROW_HEIGHT}
              />
            ))}
          </div>
          <Playhead step={playhead} stepWidth={STEP_WIDTH} height={rollHeight} />
        </div>
      </div>
    </div>
  );
}

const GridCells = memo(function GridCells({
  totalSteps,
  scaleLock,
  onToggleNote,
}: {
  totalSteps: number;
  scaleLock: boolean;
  onToggleNote: (pitch: number, startTime: number) => void;
}) {
  return (
    <div
      className="cell-grid"
      style={{
        gridTemplateColumns: `repeat(${totalSteps}, var(--step-width))`,
        gridTemplateRows: `repeat(${PITCHES.length}, var(--row-height))`,
      }}
    >
      {PITCHES.map((pitch) =>
        Array.from({ length: totalSteps }, (_, step) => {
          const disabled = scaleLock && !isInDefaultScale(pitch);

          return (
            <button
              key={`${pitch}-${step}`}
              className={[
                "note-cell",
                step % 4 === 0 ? "beat" : "",
                step % 16 === 0 ? "bar" : "",
                disabled ? "disabled" : "",
              ].join(" ")}
              disabled={disabled}
              onClick={() => onToggleNote(pitch, step)}
              aria-label={`${pitchToName(pitch)} step ${step + 1}`}
            />
          );
        }),
      )}
    </div>
  );
});
