import Phaser from "phaser";

const ENEMY_STATS = {
  virus: {
    hp: 2,
    points: 100,
    speed: 95,
  },

  trojan: {
    hp: 4,
    points: 240,
    speed: 145,
  },

  spyware: {
    hp: 3,
    points: 220,
    speed: 70,
  },

  phishing: {
    hp: 3,
    points: 260,
    speed: 70,
  },

  ransomware: {
    hp: 6,
    points: 400,
    speed: 70,
  },

  worm: {
    hp: 2,
    points: 140,
    speed: 135,
  },
};

const SHOOT_RANGE = 560;
const SHOOT_COOLDOWN = 1500;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    super(scene, x, y, type);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.kind = type;

    const stats = ENEMY_STATS[type];

    this.hp = stats.hp;
    this.points = stats.points;
    this.speed = stats.speed;

    this.lastShot = 0;
    this.counted = false;

    this.setCollideWorldBounds(true);
  }

  take(damage = 1) {
    if (!this.active || this.counted) {
      return;
    }

    this.hp -= damage;

    this.flashDamage();

    if (this.hp <= 0) {
      this.scene.killEnemy(this);
    }
  }

  flashDamage() {
    this.setTintFill(0xffffff);

    this.scene.time.delayedCall(60, () => {
      if (this.active) {
        this.clearTint();
      }
    });
  }

  ai(player, time) {
    const distanceX = player.x - this.x;
    const absoluteDistance = Math.abs(distanceX);

    if (this.isChaser()) {
      this.chase(distanceX);
      return;
    }

    this.keepDistance(distanceX, absoluteDistance);

    if (
      absoluteDistance < SHOOT_RANGE &&
      time > this.lastShot + SHOOT_COOLDOWN
    ) {
      this.lastShot = time;
      this.scene.enemyFire(this, player);
    }
  }

  isChaser() {
    return [
      "virus",
      "worm",
      "trojan",
    ].includes(this.kind);
  }

  chase(direction) {
    this.setVelocityX(
      Math.sign(direction) * this.speed
    );
  }

  keepDistance(direction, distance) {
    if (distance < 260) {
      this.setVelocityX(
        -Math.sign(direction) * this.speed
      );

      return;
    }

    if (distance > 430) {
      this.setVelocityX(
        Math.sign(direction) * 50
      );

      return;
    }

    this.setVelocityX(0);
  }
}