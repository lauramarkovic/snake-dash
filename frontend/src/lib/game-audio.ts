export type GameSound = "countdown" | "start" | "eat" | "milestone" | "pause" | "collision";

export class GameAudio {
  private context: AudioContext | null = null;

  play(sound: GameSound, volume: number) {
    if (typeof window === "undefined" || volume <= 0) return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    this.context ??= new AudioContextClass();
    if (this.context.state === "suspended") void this.context.resume();

    const now = this.context.currentTime;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.connect(this.context.destination);

    if (sound === "collision") {
      this.tone(gain, 120, 55, now, 0.42, "sawtooth", volume * 0.28);
      return;
    }

    const sounds: Record<
      Exclude<GameSound, "collision">,
      [number, number, OscillatorType, number]
    > = {
      countdown: [320, 380, "square", 0.1],
      start: [440, 760, "triangle", 0.2],
      eat: [620, 920, "sine", 0.12],
      milestone: [520, 1_040, "triangle", 0.36],
      pause: [280, 220, "sine", 0.12],
    };
    const [from, to, type, duration] = sounds[sound];
    this.tone(gain, from, to, now, duration, type, volume * 0.2);
  }

  private tone(
    gain: GainNode,
    from: number,
    to: number,
    start: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }
}
