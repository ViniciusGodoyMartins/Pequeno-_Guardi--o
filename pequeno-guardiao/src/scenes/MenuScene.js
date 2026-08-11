import Phaser from 'phaser';
import { Save } from '../systems/Save.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    const g = this.add.graphics();
    g.fillStyle(0x02040d).fillRect(0, 0, 1280, 720);
    g.lineStyle(1, 0x17496c, 0.5);
    for (let x = 0; x < 1280; x += 64) g.lineBetween(x, 0, x, 720);

    const T = (y, t, z, c = '#fff') => this.add.text(640, y, t, {
      fontFamily: 'monospace', fontSize: z + 'px', fontStyle: 'bold', color: c, align: 'center'
    }).setOrigin(0.5);

    const B = (y, t, cb) => this.add.text(640, y, t, {
      fontFamily: 'monospace', fontSize: '25px', color: '#fff', backgroundColor: '#0c2948',
      padding: { x: 28, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', cb);

    T(105, 'PEQUENO GUARDIÃO', 56, '#31e8ff');
    T(163, 'INVASÃO DIGITAL', 28, '#a78bfa');

    const st = Save.state();
    T(210, `RECORDE: ${st.best} PONTOS`, 19, '#ffd75e');

    B(300, 'JOGAR', () => this.scene.start('play', { index: 0 }));

    if (st.unlocked > 1) {
      B(370, `CONTINUAR: FASE ${st.unlocked}`, () => this.scene.start('play', { index: st.unlocked - 1 }));
    }

    T(485, 'A/D mover • W/ESPAÇO pular • MOUSE mirar e atirar • E terminal • ESC pausa • F11 tela cheia', 17, '#bff8ff');
  }
}
