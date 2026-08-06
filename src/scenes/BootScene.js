import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    const g = this.make.graphics({ add: false });
    const tex = (k, w, h, f) => {
      g.clear();
      f(g);
      g.generateTexture(k, w, h);
    };

    tex('hero', 46, 62, p => {
      p.fillStyle(0x08192f).fillRoundedRect(8, 13, 30, 43, 8);
      p.fillStyle(0x35eaff).fillRoundedRect(10, 2, 26, 21, 7);
      p.fillStyle(0xffffff).fillRect(15, 10, 16, 4);
      p.fillStyle(0x8b5cf6).fillRect(2, 25, 42, 13);
      p.fillStyle(0x22e39a).fillCircle(23, 33, 5);
      p.fillStyle(0x35eaff).fillRect(6, 55, 12, 7).fillRect(28, 55, 12, 7);
    });

    // Arma que acompanha o mouse (desenhada apontando para a direita;
    // a rotação em tempo real cuida de mirar em qualquer direção)
    tex('gun', 34, 16, p => {
      p.fillStyle(0x0c2948).fillRoundedRect(0, 4, 22, 9, 3);
      p.fillStyle(0x8b5cf6).fillRect(2, 1, 9, 5);
      p.fillStyle(0x35eaff).fillRect(19, 5, 11, 7);
      p.fillStyle(0xffffff).fillRect(27, 6, 5, 5);
    });

    tex('virus', 38, 34, p => {
      p.fillStyle(0xff356b).fillCircle(19, 17, 11);
      p.lineStyle(3, 0xff91a8);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        p.lineBetween(19, 17, 19 + Math.cos(a) * 17, 17 + Math.sin(a) * 15);
      }
    });

    tex('trojan', 42, 42, p => {
      p.fillStyle(0xffb020).fillRoundedRect(3, 8, 36, 31, 4);
      p.fillStyle(0xffe08a).fillRect(3, 8, 36, 8);
      p.fillStyle(0x071426).fillTriangle(21, 16, 12, 32, 30, 32);
    });

    tex('spyware', 46, 34, p => {
      p.fillStyle(0x8b5cf6).fillEllipse(23, 17, 44, 28);
      p.fillStyle(0xffffff).fillCircle(23, 17, 10);
      p.fillStyle(0x071426).fillCircle(23, 17, 5);
    });

    tex('phishing', 42, 38, p => {
      p.fillStyle(0x31e8ff).fillRoundedRect(3, 4, 36, 30, 5);
      p.fillStyle(0x071426).fillRect(8, 10, 26, 3).fillRect(8, 17, 18, 3);
    });

    tex('ransomware', 44, 44, p => {
      p.fillStyle(0xaf173d).fillRoundedRect(3, 12, 38, 29, 5);
      p.lineStyle(5, 0xff91a8).strokeCircle(22, 13, 10);
      p.fillStyle(0x071426).fillCircle(22, 25, 5);
    });

    tex('worm', 48, 28, p => {
      for (let i = 0; i < 4; i++) p.fillStyle(i % 2 ? 0x22e39a : 0x35eaff).fillCircle(9 + i * 10, 14, 8);
    });

    // Boss - Fase 1 (aparência original, fase 5)
    tex('boss', 76, 96, p => {
      p.fillStyle(0x3b1168).fillTriangle(38, 0, 3, 88, 73, 88);
      p.fillStyle(0x071426).fillCircle(38, 37, 27);
      p.lineStyle(4, 0xff356b).strokeCircle(38, 37, 21);
      p.fillStyle(0x35eaff).fillRect(22, 31, 10, 5).fillRect(44, 31, 10, 5);
    });

    // Boss - Fase 2 (redesenho: maior e mais amedrontador, fase 6)
    tex('bossPhase2', 150, 168, p => {
      // manto/silhueta espinhosa
      p.fillStyle(0x140108).fillTriangle(75, 0, 6, 150, 144, 150);
      p.fillStyle(0x28040f).fillTriangle(75, 18, 22, 150, 128, 150);
      // espinhos nos ombros
      p.fillStyle(0x3b0a1a);
      p.fillTriangle(6, 70, -18, 34, 30, 78);
      p.fillTriangle(144, 70, 168, 34, 120, 78);
      // núcleo/rosto
      p.fillStyle(0x030109).fillCircle(75, 66, 46);
      p.lineStyle(6, 0xff0033, 0.9).strokeCircle(75, 66, 46);
      p.lineStyle(2, 0xff5577, 0.6).strokeCircle(75, 66, 54);
      // olhos incandescentes
      p.fillStyle(0xff2a4d).fillCircle(56, 60, 10).fillCircle(94, 60, 10);
      p.fillStyle(0xffffff).fillCircle(56, 60, 3).fillCircle(94, 60, 3);
      // boca com presas
      p.fillStyle(0x000000).fillRect(48, 84, 54, 16);
      p.fillStyle(0xe8e8f0)
        .fillTriangle(52, 84, 59, 100, 66, 84)
        .fillTriangle(84, 84, 91, 100, 98, 84);
      // coroa de circuitos no topo
      p.fillStyle(0xff356b);
      p.fillRect(70, 4, 10, 20);
      p.fillTriangle(58, 24, 75, 4, 75, 24);
      p.fillTriangle(92, 24, 75, 4, 75, 24);
    });

    tex('plasma', 20, 10, p => {
      p.fillStyle(0x35eaff, 0.7).fillEllipse(10, 5, 20, 10);
      p.fillStyle(0xffffff).fillEllipse(10, 5, 10, 4);
    });

    tex('enemyShot', 14, 14, p => {
      p.fillStyle(0xff356b).fillCircle(7, 7, 7);
    });

    tex('terminal', 54, 72, p => {
      p.fillStyle(0x0c2948).fillRoundedRect(3, 3, 48, 66, 5);
      p.lineStyle(3, 0x35eaff).strokeRoundedRect(3, 3, 48, 66, 5);
      p.fillStyle(0x22e39a).fillRect(12, 14, 30, 28);
    });

    tex('item', 26, 26, p => {
      p.fillStyle(0x22e39a).fillCircle(13, 13, 12);
      p.fillStyle(0xffffff).fillRect(10, 4, 6, 18).fillRect(4, 10, 18, 6);
    });

    this.scene.start('menu');
  }
}
