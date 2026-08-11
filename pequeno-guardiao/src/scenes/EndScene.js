import Phaser from 'phaser';
import { Save } from '../systems/Save.js';

export class EndScene extends Phaser.Scene {
  constructor() {
    super('end');
  }

  init(d) {
    this.d = d;
  }

  create() {
    this.cameras.main.setBackgroundColor('#02040d');
    const final = this.d.win && this.d.index === 5;

    const T = (y, t, z, c = '#fff') => this.add.text(640, y, t, {
      fontFamily: 'monospace', fontSize: z + 'px', fontStyle: 'bold', color: c, align: 'center',
      wordWrap: { width: 1000 }
    }).setOrigin(0.5);

    const B = (y, t, cb) => this.add.text(640, y, t, {
      fontFamily: 'monospace', fontSize: '24px', color: '#fff', backgroundColor: '#0c2948',
      padding: { x: 25, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', cb);

    T(130, this.d.win ? (final ? 'SISTEMA PROTEGIDO!' : 'SETOR RESTAURADO') : 'SOLDADO DESATIVADO', 48, this.d.win ? '#31e8ff' : '#ff356b');
    T(260, final ? `A melhor defesa começa com boas escolhas.\nPense antes de clicar, use senhas fortes e mantenha backups.` : this.d.tip, 23);
    T(360, `PONTOS ${this.d.score} • RECORDE ${Save.state().best}`, 22, '#22e39a');

    if (this.d.win && !final) {
      B(460, 'PRÓXIMA FASE', () => this.scene.start('play', { index: this.d.index + 1 }));
    }
    B(530, 'JOGAR NOVAMENTE', () => this.scene.start('play', { index: this.d.index }));
    B(600, 'MENU', () => this.scene.start('menu'));
  }
}
