import Phaser from "phaser";

const BOSS_HEALTH = 24;

const DAMAGE_DELAY = 150;
const ATTACK_DELAY = 650;
const VULNERABLE_TIME = 1700;

const TELEPORT_POSITIONS = [
  2050,
  2200,
  2330,
];

export class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "boss");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);

    this.hp = BOSS_HEALTH;
    this.maxHp = BOSS_HEALTH;

    this.vulnerable = false;
    this.busy = false;
    this.dead = false;

    scene.time.delayedCall(500, () => {
      this.startCycle();
    });
  }

  damage(amount) {
    if (!this.canTakeDamage()) {
      return false;
    }

    this.busy = true;
    this.vulnerable = false;

    this.hp = Math.max(
      0,
      this.hp - amount
    );

    this.scene.updateBoss();

    if (this.hp === 0) {
      this.defeat();
      return true;
    }

    this.recoverAfterDamage();

    return true;
  }

  canTakeDamage() {
    return (
      this.active &&
      !this.dead &&
      this.vulnerable &&
      !this.busy
    );
  }

  recoverAfterDamage() {
    this.scene.time.delayedCall(
      DAMAGE_DELAY,
      () => {
        if (!this.active || this.dead) {
          return;
        }

        this.busy = false;
        this.vulnerable = true;
      }
    );
  }

  defeat() {
    this.dead = true;
    this.body.enable = false;

    this.scene.time.delayedCall(
      120,
      () => this.scene.completeLevel()
    );
  }

  startCycle() {
    if (!this.active || this.dead) {
      return;
    }

    this.prepareAttack();
  }

  prepareAttack() {
    this.busy = true;
    this.vulnerable = false;

    this.setAlpha(0.55);

    this.scene.tip(
      "ATAQUE DO HACKER"
    );

    this.scene.time.delayedCall(
      ATTACK_DELAY,
      () => this.executeAttack()
    );
  }

  executeAttack() {
    if (!this.active || this.dead) {
      return;
    }

    const attack =
      Phaser.Math.Between(0, 2);

    switch (attack) {
      case 0:
        this.multiShot();
        break;

      case 1:
        this.teleport();
        break;

      case 2:
        this.spawnMinion();
        break;
    }

    this.finishAttack();
  }

  multiShot() {
    for (let i = -2; i <= 2; i++) {
      this.scene.enemyFire(
        this,
        this.scene.player,
        i * 0.16
      );
    }
  }

  teleport() {
    const x = Phaser.Utils.Array.GetRandom(
      TELEPORT_POSITIONS
    );

    this.setPosition(x, 450);
  }

  spawnMinion() {
    this.scene.spawnEnemy(
      Phaser.Math.Between(2030, 2300),
      520,
      "virus",
      false
    );
  }

  finishAttack() {
    this.scene.time.delayedCall(
      ATTACK_DELAY,
      () => {
        if (!this.active || this.dead) {
          return;
        }

        this.busy = false;
        this.vulnerable = true;

        this.setAlpha(1);

        this.scene.tip(
          "HACKER VULNERÁVEL"
        );

        this.scene.time.delayedCall(
          VULNERABLE_TIME,
          () => this.startCycle()
        );
      }
    );
  }
}