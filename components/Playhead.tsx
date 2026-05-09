"use client";

export default function Playhead({
  step,
  stepWidth,
  height,
}: {
  step: number | null;
  stepWidth: number;
  height: number;
}) {
  if (step === null) return null;

  return (
    <div
      className="playhead"
      style={{
        height,
        transform: `translateX(${step * stepWidth}px)`,
      }}
    />
  );
}
