"use client";

import { memo } from "react";
import { PianoRollNote } from "@/hooks/useTonePlayback";
import { PITCHES, pitchToName } from "@/lib/music";

function NoteBlock({
  note,
  stepWidth,
  rowHeight,
}: {
  note: PianoRollNote;
  stepWidth: number;
  rowHeight: number;
}) {
  const pitchIndex = PITCHES.indexOf(note.pitch);

  if (pitchIndex < 0) return null;

  return (
    <div
      className="note-block"
      style={{
        left: note.startTime * stepWidth,
        top: pitchIndex * rowHeight,
        width: note.duration * stepWidth,
        height: rowHeight,
      }}
      aria-label={`${pitchToName(note.pitch)} note at step ${note.startTime + 1}`}
    />
  );
}

export default memo(NoteBlock);
