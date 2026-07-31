import { Save } from "./Save.js";

const SOUND_EFFECTS = {
  shot: [760, 0.05],
  hit: [180, 0.06, "sawtooth"],
  hurt: [90, 0.14, "sawtooth"],
  terminal: [620, 0.25, "sine"],
  win: [900, 0.4, "triangle"],
  lose: [70, 0.4, "sawtooth"],
};

export class Audio {
  constructor() {
    this.on = Save.state().sound;
    this.ctx = null;
  }

  getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    return this.ctx;
  }

  tone(frequency = 440, duration = 0.07, type = "square") {
    if (!this.on) {
      return;
    }

    const context = this.getContext();

    context.resume();

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0.03, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  play(effect) {
    const sound = SOUND_EFFECTS[effect];

    if (!sound) {
      return;
    }

    this.tone(...sound);
  }
}