export const LOWEST_PITCH = 48;
export const HIGHEST_PITCH = 72;

export const PITCHES = Array.from(
  { length: HIGHEST_PITCH - LOWEST_PITCH + 1 },
  (_, index) => HIGHEST_PITCH - index,
);

export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const DEFAULT_SCALE_ROOT = "D";
export const DEFAULT_SCALE_NAME = "minor";
const D_MINOR_PITCH_CLASSES = new Set([2, 4, 5, 7, 9, 10, 0]);

export function pitchToName(pitch: number) {
  const octave = Math.floor(pitch / 12) - 1;
  return `${NOTE_NAMES[pitch % 12]}${octave}`;
}

export function isInDefaultScale(pitch: number) {
  return D_MINOR_PITCH_CLASSES.has(pitch % 12);
}

export function getScaleChordPitches(rootPitch: number) {
  const scalePitches = PITCHES.filter(
    (pitch) => pitch >= rootPitch && isInDefaultScale(pitch),
  ).sort((a, b) => a - b);

  return scalePitches.filter((_, index) => index === 0 || index === 2 || index === 4);
}
