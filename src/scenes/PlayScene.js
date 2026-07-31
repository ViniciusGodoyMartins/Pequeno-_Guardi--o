import Phaser from 'phaser';

import { LEVELS, TIPS } from '../data/levels.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Audio } from '../systems/Audio.js';
import { Save } from '../systems/Save.js';

const WORLD = Object.freeze({
  width: 2500,
  height: 720,
  deathY: 760,
});

const PLAYER_CONFIG = Object.freeze({
  startX: 90,
  startY: 590,
  maxHp: 6,
  terminalDistance: 155,
});

const PROJECTILE_CONFIG = Object.freeze({
  playerSpeed: 760,
  enemySpeed: 290,
  playerLifetime: 1300,
  enemyLifetime: 2400,
  maxPlayerBullets: 36,
  maxEnemyBullets: 30,
});

const COLORS = Object.freeze({
  background: 0x02040d,
  terminalActive: 0x22e39a,
  bossHealth: 0xff356b,
});

const PLATFORM_LAYOUT = Object.freeze([
  [500, 680, 1000, 80],
  [1240, 680, 400, 80],
  [1800, 680, 600, 80],
  [2300, 680, 400, 80],
  [350, 530, 180, 22],
  [760, 470, 200, 22],
  [1180, 535, 190, 22],
  [1580, 455, 200, 22],
  [2050, 525, 200, 22],
]);

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');

    this.pauseBox = null;
    this.boss = null;
  }

  init(data = {}) {
    const requestedIndex = Number(data.index) || 0;

    this.index = Phaser.Math.Clamp(
      requestedIndex,
      0,
      LEVELS.length - 1,
    );

    this.level = LEVELS[this.index];
  }

  create() {
    this.resetState();
    this.configureWorld();
    this.drawBackground();
    this.createPlatforms();
    this.createEntities();
    this.createProjectiles();
    this.createInteractiveObjects();
    this.configurePhysics();
    this.configureControls();
    this.createHud();

    this.tip(this.level.tip);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  resetState() {
    this.score = 0;
    this.objective = 'ELIMINE AS AMEAÇAS';
    this.remainingThreats = 0;

    this.terminalOn = false;
    this.overloaded = false;
    this.ended = false;

    this.pauseBox = null;
    this.boss = null;

    this.audio = new Audio();
  }

  configureWorld() {
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
  }

  drawBackground() {
    const graphics = this.add.graphics();

    graphics
      .fillStyle(COLORS.background)
      .fillRect(0, 0, WORLD.width, WORLD.height);

    graphics.lineStyle(2, this.level.color, 0.28);

    for (let x = 0; x < WORLD.width; x += 90) {
      graphics.lineBetween(x, 0, x, WORLD.height);
    }
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    PLATFORM_LAYOUT.forEach(([x, y, width, height]) => {
      const platform = this.add
        .rectangle(x, y, width, height, this.level.color, 0.18)
        .setStrokeStyle(3, this.level.color);

      this.physics.add.existing(platform, true);
      this.platforms.add(platform);
    });
  }

  createEntities() {
    this.player = new Player(
      this,
      PLAYER_CONFIG.startX,
      PLAYER_CONFIG.startY,
    );

    this.enemies = this.physics.add.group();

    this.level.enemies.forEach((kind, index) => {
      this.spawnEnemy(
        420 + index * 330,
        450 + (index % 2) * 130,
        kind,
      );
    });

    this.cameras.main.startFollow(
      this.player,
      true,
      0.1,
      0.1,
      -170,
      50,
    );
  }

  createProjectiles() {
    this.bullets = this.physics.add.group({
      maxSize: PROJECTILE_CONFIG.maxPlayerBullets,
      allowGravity: false,
    });

    this.enemyBullets = this.physics.add.group({
      maxSize: PROJECTILE_CONFIG.maxEnemyBullets,
      allowGravity: false,
    });
  }

  createInteractiveObjects() {
    this.terminal = this.physics.add.staticSprite(
      1780,
      600,
      'terminal',
    );

    this.prompt = this.add
      .text(1780, 525, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#071426',
        padding: {
          x: 10,
          y: 6,
        },
      })
      .setOrigin(0.5);

    this.item = this.physics.add.staticSprite(
      1180,
      500,
      'item',
    );
  }

  configurePhysics() {
    this.physics.add.collider(this.player, this.platforms);

    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.hitEnemy,
      null,
      this,
    );

    this.physics.add.collider(
      this.bullets,
      this.platforms,
      this.handlePlayerBulletPlatformCollision,
      null,
      this,
    );

    this.physics.add.collider(
      this.enemyBullets,
      this.platforms,
      this.handleEnemyBulletPlatformCollision,
      null,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.enemyBullets,
      this.handleEnemyBulletHit,
      null,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handleEnemyContact,
      null,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.item,
      this.collectItem,
      null,
      this,
    );
  }

  configureControls() {
    this.input.on('pointerdown', this.fire, this);

    this.input.keyboard.on('keydown-E', this.interact, this);
    this.input.keyboard.on('keydown-ESC', this.pause, this);
    this.input.keyboard.on(
      'keydown-F',
      this.toggleFullscreen,
      this,
    );

    this.preventedKeys = this.input.keyboard.addKeys({
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });

    Object.values(this.preventedKeys).forEach((key) => {
      key.on('down', this.preventDefaultKey);
    });
  }

  preventDefaultKey(event) {
    event.preventDefault();
  }

  createHud() {
    const baseStyle = {
      fontFamily: 'monospace',
      fontSize: '19px',
      color: '#ffffff',
      stroke: '#02040d',
      strokeThickness: 5,
    };

    this.hud = this.add
      .text(20, 16, '', baseStyle)
      .setScrollFactor(0)
      .setDepth(50);

    this.msg = this.add
      .text(640, 655, '', {
        ...baseStyle,
        fontSize: '21px',
        backgroundColor: '#071426dd',
        padding: {
          x: 16,
          y: 9,
        },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60);

    this.bossBar = this.add
      .rectangle(427, 68, 426, 12, COLORS.bossHealth)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(51)
      .setVisible(false);
  }

  update(time, delta) {
    if (this.ended || this.pauseBox) {
      return;
    }

    this.player.update(time, delta);

    this.updateEnemies(time);
    this.updateTerminalPrompt();
    this.updateHud();

    if (this.player.y > WORLD.deathY) {
      this.fail();
    }
  }

  updateEnemies(time) {
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active || enemy.counted) {
        return;
      }

      if (
        enemy.y > WORLD.deathY ||
        enemy.x < -100 ||
        enemy.x > WORLD.width + 100
      ) {
        enemy.setPosition(
          Phaser.Math.Clamp(enemy.x, 150, 2350),
          500,
        );

        enemy.setVelocity(0);
      }

      enemy.ai(this.player, time);
    });
  }

  updateTerminalPrompt() {
    if (this.terminalOn) {
      this.prompt.setText('');
      return;
    }

    const isNearTerminal = this.isNear(
      this.player,
      this.terminal,
      PLAYER_CONFIG.terminalDistance,
    );

    if (!isNearTerminal) {
      this.prompt.setText('');
      return;
    }

    const text =
      this.remainingThreats === 0
        ? 'PRESSIONE E'
        : `${this.remainingThreats} AMEAÇA(S) RESTANTE(S)`;

    this.prompt.setText(text);
  }

  updateHud() {
    const hp = Phaser.Math.Clamp(
      this.player.hp,
      0,
      PLAYER_CONFIG.maxHp,
    );

    const filledHp = '◆'.repeat(hp);
    const emptyHp = '◇'.repeat(PLAYER_CONFIG.maxHp - hp);

    this.hud.setText(
      [
        `VIDA ${filledHp}${emptyHp}`,
        this.level.title,
        this.objective,
        `PONTOS ${this.score}`,
      ].join('  •  '),
    );
  }

  spawnEnemy(x, y, kind, countForTerminal = true) {
    if (this.ended) {
      return null;
    }

    const enemy = new Enemy(this, x, y, kind);

    enemy.countForTerminal = countForTerminal;

    this.enemies.add(enemy);
    this.physics.add.collider(enemy, this.platforms);

    if (countForTerminal) {
      this.remainingThreats += 1;
    }

    return enemy;
  }

  fire() {
    if (!this.canFire()) {
      return;
    }

    const cooldown = this.index >= 2 ? 130 : 190;

    this.player.nextShot = this.time.now + cooldown;

    this.applyWeaponHeat();

    const pointer = this.input.activePointer.positionToCamera(
      this.cameras.main,
    );

    const baseAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y - 10,
      pointer.x,
      pointer.y,
    );

    const damage = this.index >= 1 ? 2 : 1;
    const offsets = this.index >= 4
      ? [-0.13, 0, 0.13]
      : [0];

    offsets.forEach((angleOffset) => {
      this.createPlayerBullet(
        baseAngle + angleOffset,
        damage,
      );
    });

    this.audio.play('shot');
  }

  canFire() {
    if (this.ended || this.pauseBox) {
      return false;
    }

    if (this.time.now < this.player.nextShot) {
      return false;
    }

    if (!this.overloaded && this.player.overheated) {
      return false;
    }

    return true;
  }

  applyWeaponHeat() {
    if (this.overloaded) {
      return;
    }

    const heatCost = this.index >= 2 ? 10 : 15;

    this.player.heat = Math.min(
      110,
      this.player.heat + heatCost,
    );

    if (this.player.heat >= 100) {
      this.player.overheated = true;
    }
  }

  createPlayerBullet(angle, damage) {
    const x = this.player.x + Math.cos(angle) * 32;
    const y = this.player.y - 10;

    const bullet = this.bullets.get(x, y, 'plasma');

    if (!bullet) {
      return;
    }

    bullet.setDataEnabled();
    bullet.setData({
      used: false,
      damage,
      hitIds: new Set(),
    });

    bullet.enableBody(true, x, y, true, true);
    bullet.body.setAllowGravity(false);

    this.physics.velocityFromRotation(
      angle,
      PROJECTILE_CONFIG.playerSpeed,
      bullet.body.velocity,
    );

    this.scheduleBulletRemoval(
      bullet,
      PROJECTILE_CONFIG.playerLifetime,
    );
  }

  enemyFire(from, target, angleOffset = 0) {
    if (!from?.active || !target?.active) {
      return;
    }

    const angle =
      Phaser.Math.Angle.Between(
        from.x,
        from.y,
        target.x,
        target.y,
      ) + angleOffset;

    const bullet = this.enemyBullets.get(
      from.x,
      from.y,
      'enemyShot',
    );

    if (!bullet) {
      return;
    }

    bullet.setDataEnabled();
    bullet.setData('used', false);

    bullet.enableBody(
      true,
      from.x,
      from.y,
      true,
      true,
    );

    bullet.body.setAllowGravity(false);

    this.physics.velocityFromRotation(
      angle,
      PROJECTILE_CONFIG.enemySpeed,
      bullet.body.velocity,
    );

    this.scheduleBulletRemoval(
      bullet,
      PROJECTILE_CONFIG.enemyLifetime,
    );
  }

  scheduleBulletRemoval(bullet, delay) {
    this.time.delayedCall(delay, () => {
      if (bullet.active) {
        this.stopBullet(bullet);
      }
    });
  }

  stopBullet(bullet, showImpact = false) {
    if (!bullet?.active || bullet.getData('used')) {
      return;
    }

    const { x, y } = bullet;

    bullet.setData('used', true);
    bullet.body.stop();
    bullet.disableBody(true, true);

    if (showImpact) {
      this.impact(x, y);
    }
  }

  hitEnemy(bullet, enemy) {
    if (
      !bullet?.active ||
      bullet.getData('used') ||
      !enemy?.active ||
      enemy.counted
    ) {
      return;
    }

    const hitIds = bullet.getData('hitIds');

    if (hitIds?.has(enemy)) {
      return;
    }

    hitIds?.add(enemy);

    this.impact(enemy.x, enemy.y);
    enemy.take(bullet.getData('damage') || 1);

    if (this.index < 3) {
      this.stopBullet(bullet);
    }
  }

  killEnemy(enemy) {
    if (!enemy || enemy.counted) {
      return;
    }

    enemy.counted = true;

    const {
      kind,
      x,
      y,
      points,
      countForTerminal,
    } = enemy;

    enemy.setActive(false).setVisible(false);

    if (enemy.body) {
      enemy.body.stop();
      enemy.body.enable = false;
    }

    if (countForTerminal) {
      this.remainingThreats = Math.max(
        0,
        this.remainingThreats - 1,
      );
    }

    this.score += points;

    this.impact(x, y);
    this.tip(TIPS[kind] || 'Ameaça eliminada.');

    this.time.delayedCall(0, () => {
      enemy.destroy();
    });

    if (
      this.remainingThreats === 0 &&
      !this.terminalOn
    ) {
      this.unlockTerminal();
    }
  }

  unlockTerminal() {
    this.objective = 'ATIVE O TERMINAL COM E';

    this.terminal.setTint(COLORS.terminalActive);

    this.tweens.add({
      targets: this.terminal,
      alpha: 0.65,
      duration: 450,
      yoyo: true,
      repeat: -1,
    });

    this.tip(
      'Área protegida. Aproxime-se do terminal e pressione E.',
    );
  }

  interact() {
    if (this.ended || this.terminalOn) {
      return;
    }

    const isNearTerminal = this.isNear(
      this.player,
      this.terminal,
      PLAYER_CONFIG.terminalDistance,
    );

    if (!isNearTerminal) {
      return;
    }

    if (this.remainingThreats > 0) {
      this.tip(
        `Elimine as ameaças restantes: ${this.remainingThreats}.`,
      );
      return;
    }

    this.activateTerminal();
  }

  activateTerminal() {
    this.terminalOn = true;

    this.tweens.killTweensOf(this.terminal);

    this.terminal
      .setAlpha(1)
      .setTint(COLORS.terminalActive);

    this.score += 500;
    this.overloaded = this.index === 4;

    this.audio.play('terminal');
    this.tip(`Melhoria liberada: ${this.level.upgrade}`);

    if (this.index === 4) {
      this.time.delayedCall(700, this.startBoss, [], this);
      return;
    }

    this.time.delayedCall(
      1200,
      this.completeLevel,
      [],
      this,
    );
  }

  startBoss() {
    if (this.ended) {
      return;
    }

    this.objective = 'DERROTE O HACKER';
    this.boss = new Boss(this, 2200, 450);

    this.bossBar.setVisible(true);

    this.physics.add.overlap(
      this.bullets,
      this.boss,
      this.handleBossHit,
      null,
      this,
    );
  }

  handleBossHit(firstObject, secondObject) {
    const boss =
      firstObject === this.boss
        ? firstObject
        : secondObject;

    const bullet =
      firstObject === this.boss
        ? secondObject
        : firstObject;

    if (
      !bullet?.active ||
      bullet.getData('used') ||
      !boss?.active
    ) {
      return;
    }

    const { x, y } = bullet;
    const damage = bullet.getData('damage') || 1;

    this.stopBullet(bullet);

    const damaged = boss.damage(damage);

    this.impact(x, y);

    if (!damaged && !boss.dead) {
      this.tip('Espere o hacker ficar vulnerável.');
    }
  }

  updateBoss() {
    if (!this.boss || !this.bossBar) {
      return;
    }

    const healthPercentage = Phaser.Math.Clamp(
      this.boss.hp / this.boss.maxHp,
      0,
      1,
    );

    this.bossBar.width = 426 * healthPercentage;
  }

  handlePlayerBulletPlatformCollision(bullet) {
    this.stopBullet(bullet, true);
  }

  handleEnemyBulletPlatformCollision(bullet) {
    this.stopBullet(bullet);
  }

  handleEnemyBulletHit(player, bullet) {
    this.stopBullet(bullet);
    this.hurt();
  }

  handleEnemyContact() {
    this.hurt();
  }

  collectItem() {
    if (!this.item.active) {
      return;
    }

    this.item.disableBody(true, true);

    this.player.hp = Math.min(
      PLAYER_CONFIG.maxHp,
      this.player.hp + 2,
    );
  }

  hurt() {
    if (!this.player.damage()) {
      return;
    }

    this.audio.play('hurt');

    if (this.player.hp <= 0) {
      this.fail();
    }
  }

  impact(x, y) {
    this.audio.play('hit');

    for (let index = 0; index < 4; index += 1) {
      const particle = this.add.rectangle(
        x,
        y,
        4,
        4,
        this.level.color,
      );

      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-24, 24),
        y: y + Phaser.Math.Between(-24, 24),
        alpha: 0,
        duration: 200,
        onComplete: () => particle.destroy(),
      });
    }
  }

  tip(text) {
    this.tweens.killTweensOf(this.msg);

    this.msg
      .setText(text)
      .setAlpha(1);

    this.tweens.add({
      targets: this.msg,
      alpha: 0,
      delay: 2800,
      duration: 300,
    });
  }

  completeLevel() {
    if (this.ended) {
      return;
    }

    this.ended = true;
    this.physics.pause();

    const saveState = Save.state();

    const unlocked = Math.max(
      saveState.unlocked,
      Math.min(LEVELS.length, this.index + 2),
    );

    const best = Math.max(
      saveState.best,
      this.score,
    );

    Save.patch({
      unlocked,
      best,
    });

    this.audio.play('win');

    this.time.delayedCall(600, () => {
      this.scene.start('end', {
        win: true,
        index: this.index,
        score: this.score,
        tip: this.level.tip,
      });
    });
  }

  fail() {
    if (this.ended) {
      return;
    }

    this.ended = true;
    this.physics.pause();
    this.audio.play('lose');

    this.time.delayedCall(400, () => {
      this.scene.start('end', {
        win: false,
        index: this.index,
        score: this.score,
        tip: this.level.tip,
      });
    });
  }

  pause() {
    if (this.ended) {
      return;
    }

    if (this.pauseBox) {
      this.resumeGame();
      return;
    }

    this.physics.pause();
    this.time.paused = true;
    this.tweens.pauseAll();

    this.pauseBox = this.add
      .text(
        640,
        360,
        'PAUSADO\n\nESC PARA CONTINUAR',
        {
          fontFamily: 'monospace',
          fontSize: '36px',
          color: '#ffffff',
          backgroundColor: '#02040dee',
          padding: {
            x: 60,
            y: 40,
          },
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
  }

  resumeGame() {
    this.pauseBox.destroy();
    this.pauseBox = null;

    this.time.paused = false;
    this.physics.resume();
    this.tweens.resumeAll();
  }

  toggleFullscreen() {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      return;
    }

    this.scale.startFullscreen();
  }

  isNear(firstObject, secondObject, maxDistance) {
    return (
      Phaser.Math.Distance.Between(
        firstObject.x,
        firstObject.y,
        secondObject.x,
        secondObject.y,
      ) <= maxDistance
    );
  }

  cleanup() {
    this.input.off('pointerdown', this.fire, this);

    this.input.keyboard.off(
      'keydown-E',
      this.interact,
      this,
    );

    this.input.keyboard.off(
      'keydown-ESC',
      this.pause,
      this,
    );

    this.input.keyboard.off(
      'keydown-F',
      this.toggleFullscreen,
      this,
    );

    if (this.preventedKeys) {
      Object.values(this.preventedKeys).forEach((key) => {
        key.off('down', this.preventDefaultKey);
      });
    }

    this.tweens.killTweensOf(this.terminal);
    this.tweens.killTweensOf(this.msg);

    this.pauseBox = null;
    this.boss = null;
  }
}