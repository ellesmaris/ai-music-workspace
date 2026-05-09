"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { pitchToName } from "@/lib/music";

export type PianoRollNote = {
  id: string;
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
};

type ToneSequence = InstanceType<typeof Tone.Sequence<number>>;

export function useTonePlayback({
  notes,
  bpm,
  totalSteps,
}: {
  notes: PianoRollNote[];
  bpm: number;
  totalSteps: number;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const sequenceRef = useRef<ToneSequence | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const notesRef = useRef(notes);
  const bpmRef = useRef(bpm);
  const totalStepsRef = useRef(totalSteps);

  useEffect(() => {
    notesRef.current = notes;
    bpmRef.current = bpm;
    totalStepsRef.current = totalSteps;
  }, [bpm, notes, totalSteps]);

  const stop = useCallback(() => {
    const transport = Tone.getTransport();

    transport.stop();
    transport.cancel();
    Tone.getDraw().cancel();
    sequenceRef.current?.dispose();
    sequenceRef.current = null;
    setIsPlaying(false);
    setPlayhead(null);
  }, []);

  const play = useCallback(async () => {
    stop();
    await Tone.start();

    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.25, release: 0.12 },
        oscillator: { type: "triangle" },
      }).toDestination();
    }

    const transport = Tone.getTransport();
    const currentBpm = bpmRef.current;
    const currentTotalSteps = totalStepsRef.current;
    const stepDuration = 60 / currentBpm / 4;
    transport.bpm.value = currentBpm;
    transport.loop = true;
    transport.setLoopPoints(0, `${currentTotalSteps / 16}m`);

    const steps = Array.from({ length: currentTotalSteps }, (_, step) => step);
    sequenceRef.current = new Tone.Sequence<number>(
      (time, step) => {
        Tone.getDraw().schedule(() => setPlayhead(step), time);

        for (const note of notesRef.current) {
          if (note.startTime === step) {
            synthRef.current?.triggerAttackRelease(
              pitchToName(note.pitch),
              note.duration * stepDuration,
              time,
              note.velocity,
            );
          }
        }
      },
      steps,
      "16n",
    ).start(0);

    transport.start();
    setIsPlaying(true);
  }, [stop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }

    void play();
  }, [isPlaying, play, stop]);

  useEffect(() => stop, [stop]);

  return { isPlaying, playhead, play, toggle, stop };
}
