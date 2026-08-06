import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hero');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true).setDragX(1500).setMaxVelocity(330, 900);
    this.body.setSize(34, 58);

    this.hp = 6;
    this.heat = 0;
    this.overheated = false;
    this.inv = false;
    this.facing = 1;
    this.nextShot = 0;
    this.lastGround = 0;
    this.jumpQueued = 0;

    this.keys = scene.input.keyboard.addKeys('A,D,W,SHIFT');
    this.cursors = scene.input.keyboard.createCursorKeys();

    // Arma que acompanha o mouse (mira twin-stick)
    this.weapon = scene.add.sprite(x, y, 'gun').setOrigin(0.18, 0.5).setDepth(6);
    this.setDepth(5);
  }

  update(t, d) {
    const l = this.keys.A.isDown || this.cursors.left.isDown;
    const r = this.keys.D.isDown || this.cursors.right.isDown;
    const on = this.body.blocked.down;

    if (on) this.lastGround = t;

    if (Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this.jumpQueued = t;
    }

    if (this.jumpQueued && t - this.jumpQueued < 130 && t - this.lastGround < 120) {
      this.setVelocityY(-620);
      this.jumpQueued = 0;
    }

    if (l) {
      this.setAccelerationX(-1500);
      this.facing = -1;
    } else if (r) {
      this.setAccelerationX(1500);
      this.facing = 1;
    } else {
      this.setAccelerationX(0);
    }

    this.setFlipX(this.facing < 0);

    // --- Correção do tremor ao ficar parado ---
    // Enquanto o corpo está apoiado e a gravidade ainda empurra a velocidade Y
    // para baixo, a física de colisão fica corrigindo a posição a cada frame,
    // o que causava uma vibração visível quando o player estava parado.
    if (on && this.body.velocity.y > 0) {
      this.setVelocityY(0);
    }
    // Zera pequenas velocidades residuais no eixo X (ruído de ponto flutuante
    // do drag) para garantir uma parada limpa, sem "tremedeira".
    if (!l && !r && Math.abs(this.body.velocity.x) < 4) {
      this.setVelocityX(0);
      this.setAccelerationX(0);
    }

    this.heat = Math.max(0, this.heat - (this.overheated ? 32 : 18) * d / 1000);
    if (this.overheated && this.heat <= 20) this.overheated = false;

    // Atualiza a arma para sempre apontar para o mouse
    this.updateWeapon();
  }

  updateWeapon() {
    if (!this.weapon || !this.scene || !this.scene.input) return;
    const cam = this.scene.cameras.main;
    const pointer = this.scene.input.activePointer;
    const world = pointer.positionToCamera(cam);
    const originY = this.y - 10;
    const angle = Phaser.Math.Angle.Between(this.x, originY, world.x, world.y);
    const dist = 20;
    this.weapon.setPosition(this.x + Math.cos(angle) * dist, originY + Math.sin(angle) * dist);
    this.weapon.setRotation(angle);
    this.weapon.setFlipY(Math.abs(Phaser.Math.Angle.Wrap(angle)) > Math.PI / 2);
  }

  damage() {
    if (this.inv) return false;
    this.hp--;
    this.inv = true;
    this.setTint(0xff356b);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      yoyo: true,
      repeat: 4,
      duration: 60,
      onComplete: () => {
        if (this.active) {
          this.clearTint();
          this.alpha = 1;
        }
      }
    });
    this.scene.time.delayedCall(950, () => this.inv = false);
    return true;
  }

  destroy(fromScene) {
    if (this.weapon) {
      this.weapon.destroy();
      this.weapon = null;
    }
    super.destroy(fromScene);
  }
}
