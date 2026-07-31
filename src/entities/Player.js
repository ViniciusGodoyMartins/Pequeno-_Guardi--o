import Phaser from "phaser";

const MOVE_SPEED = 1500;
const MAX_SPEED_X = 330;
const MAX_SPEED_Y = 900;
const DRAG_X = 1500;
const JUMP_FORCE = -620;

const COYOTE_TIME = 120;
const JUMP_BUFFER = 130;

const HEAT_COOLDOWN = 18;
const OVERHEAT_COOLDOWN = 32;
const OVERHEAT_LIMIT = 100;
const OVERHEAT_RESET = 20;

const INVINCIBILITY_TIME = 950;

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "hero");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true)
      .setDragX(DRAG_X)
      .setMaxVelocity(MAX_SPEED_X, MAX_SPEED_Y);

    this.body.setSize(34, 58);

    this.hp = 6;
    this.heat = 0;
    this.overheated = false;
    this.invincible = false;

    this.facing = 1;
    this.nextShot = 0;

    this.lastGroundTime = 0;
    this.jumpBufferTime = 0;

    this.keys = scene.input.keyboard.addKeys("A,D,W,SHIFT");
    this.cursors = scene.input.keyboard.createCursorKeys();
  }

  update(time, delta) {
    this.updateMovement(time);
    this.updateJump(time);
    this.updateHeat(delta);

    this.setFlipX(this.facing < 0);
  }

  updateMovement(time) {
    const movingLeft =
      this.keys.A.isDown || this.cursors.left.isDown;

    const movingRight =
      this.keys.D.isDown || this.cursors.right.isDown;

    if (this.body.blocked.down) {
      this.lastGroundTime = time;
    }

    if (movingLeft) {
      this.setAccelerationX(-MOVE_SPEED);
      this.facing = -1;
    } else if (movingRight) {
      this.setAccelerationX(MOVE_SPEED);
      this.facing = 1;
    } else {
      this.setAccelerationX(0);
    }
  }

  updateJump(time) {
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space);

    if (jumpPressed) {
      this.jumpBufferTime = time;
    }

    const bufferedJump =
      this.jumpBufferTime &&
      time - this.jumpBufferTime < JUMP_BUFFER;

    const coyoteJump =
      time - this.lastGroundTime < COYOTE_TIME;

    if (bufferedJump && coyoteJump) {
      this.setVelocityY(JUMP_FORCE);
      this.jumpBufferTime = 0;
    }
  }

  updateHeat(delta) {
    const cooldown = this.overheated
      ? OVERHEAT_COOLDOWN
      : HEAT_COOLDOWN;

    this.heat = Math.max(
      0,
      this.heat - (cooldown * delta) / 1000
    );

    if (this.overheated && this.heat <= OVERHEAT_RESET) {
      this.overheated = false;
    }
  }

  damage() {
    if (this.invincible) {
      return false;
    }

    this.hp--;
    this.invincible = true;

    this.setTint(0xff356b);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      yoyo: true,
      repeat: 4,
      duration: 60,
      onComplete: () => {
        if (!this.active) {
          return;
        }

        this.clearTint();
        this.alpha = 1;
      },
    });

    this.scene.time.delayedCall(
      INVINCIBILITY_TIME,
      () => {
        this.invincible = false;
      }
    );

    return true;
  }

  canShoot() {
    return !this.overheated;
  }

  addHeat(amount) {
    this.heat = Math.min(
      OVERHEAT_LIMIT + 10,
      this.heat + amount
    );

    if (this.heat >= OVERHEAT_LIMIT) {
      this.overheated = true;
    }
  }
}