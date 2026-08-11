import { Save } from './Save.js';

export class Audio {
  constructor() {
    this.on = Save.state().sound;
    this.ctx = null;
  }

  ensureCtx() {
    this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    this.ctx.resume();
    return this.ctx;
  }

  tone(f = 440, d = 0.07, t = 'square') {
    if (!this.on) return;
    const ctx = this.ensureCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = t;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.03, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + d);
  }

  // Sweep de frequência: base para efeitos futuristas (laser/plasma)
  sweep(f1 = 1200, f2 = 300, d = 0.12, t = 'sawtooth', vol = 0.05) {
    if (!this.on) return;
    const ctx = this.ensureCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = t;
    o.frequency.setValueAtTime(f1, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), ctx.currentTime + d);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + d);
  }

  play(n) {
    if (n === 'shot') {
      // Tiro futurista: sweep grave descendente + "blip" agudo em camada
      this.sweep(1600, 380, 0.09, 'sawtooth', 0.045);
      this.tone(2400, 0.025, 'square');
      return;
    }
    const m = {
      hit: [180, 0.06, 'sawtooth'],
      hurt: [90, 0.14, 'sawtooth'],
      terminal: [620, 0.25, 'sine'],
      win: [900, 0.4, 'triangle'],
      lose: [70, 0.4, 'sawtooth']
    }[n];
    if (m) this.tone(...m);
  }
}
