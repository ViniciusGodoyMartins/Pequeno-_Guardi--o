import Phaser from 'phaser';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, phase = 1) {
    super(scene, x, y, phase === 2 ? 'bossPhase2' : 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);

    this.phase = phase;
    this.hp = phase === 2 ? 40 : 24;
    this.maxHp = this.hp;
    this.vulnerable = false;
    this.busy = false;
    this.dead = false;

    this.attackTimer = null;
    this.vulnEndTimer = null;

    if (phase === 2) {
      this.setScale(1.55);
      scene.time.delayedCall(900, () => this.cyclePhase2());
    } else {
      scene.time.delayedCall(500, () => this.cycle());
    }
  }

  clearAllTimers() {
    if (this.attackTimer) { this.attackTimer.remove(); this.attackTimer = null; }
    if (this.vulnEndTimer) { this.vulnEndTimer.remove(); this.vulnEndTimer = null; }
  }

  damage(d) {
    if (!this.active || this.dead || !this.vulnerable || this.busy) return false;
    this.busy = true;
    this.hp = Math.max(0, this.hp - d);
    this.scene.updateBoss();
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.active && !this.dead) this.clearTint(); });

    if (this.hp === 0) {
      this.dead = true;
      this.vulnerable = false;
      this.body.enable = false;
      this.clearAllTimers();
      if (this.phase === 2) {
        this.scene.time.delayedCall(250, () => this.scene.completeLevel());
      } else {
        this.flee();
      }
      return true;
    }

    this.scene.time.delayedCall(120, () => { if (this.active && !this.dead) this.busy = false; });
    return true;
  }

  // ---------- FASE 1 (Fase 5 - Servidor Central) ----------
  cycle() {
    if (!this.active || this.dead) return;
    this.busy = true;
    this.vulnerable = false;
    this.setAlpha(0.55);
    this.scene.tip('ATAQUE DO HACKER');

    this.scene.time.delayedCall(650, () => {
      if (!this.active || this.dead) return;
      const n = Phaser.Math.Between(0, 2);
      if (n === 0) {
        for (let i = -2; i <= 2; i++) this.scene.enemyFire(this, this.scene.player, i * 0.16);
      } else if (n === 1) {
        this.setPosition(Phaser.Utils.Array.GetRandom([2050, 2200, 2330]), 450);
      } else {
        this.scene.spawnEnemy(Phaser.Math.Between(2030, 2300), 520, 'virus', false);
      }

      this.scene.time.delayedCall(650, () => {
        if (!this.active || this.dead) return;
        this.busy = false;
        this.vulnerable = true;
        this.setAlpha(1);
        this.scene.tip('HACKER VULNERÁVEL');
        this.scene.time.delayedCall(1700, () => this.cycle());
      });
    });
  }

  flee() {
    this.scene.tip('O sistema do hacker está instável...');
    this.scene.tweens.add({
      targets: this,
      x: this.x + 420,
      y: this.y - 300,
      angle: 35,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.scene.time.delayedCall(400, () => this.scene.bossFled());
      }
    });
  }

  // ---------- FASE 2 (Fase 6 - Núcleo do Hacker) ----------
  cyclePhase2() {
    if (!this.active || this.dead) return;
    this.busy = true;
    this.vulnerable = false;
    this.clearAllTimers();

    const waveSize = Phaser.Math.Between(5, 10);
    this.scene.objective = `DESTRUA OS INVASORES (${waveSize})`;
    this.scene.tip('O NÚCLEO ESTÁ INVOCANDO REFORÇOS!');
    this.scene.beginBossWave(waveSize);

    // Atira ocasionalmente enquanto invoca as ondas
    this.attackTimer = this.scene.time.addEvent({
      delay: 950,
      loop: true,
      callback: () => {
        if (!this.active || this.dead) { this.clearAllTimers(); return; }
        this.scene.enemyFire(this, this.scene.player, Phaser.Math.FloatBetween(-0.12, 0.12));
      }
    });
  }

  onWaveCleared() {
    if (!this.active || this.dead) return;
    if (this.attackTimer) { this.attackTimer.remove(); this.attackTimer = null; }
    this.busy = false;
    this.vulnerable = true;
    this.setTint(0xffe37a);
    this.scene.objective = 'ATAQUE O NÚCLEO - ELE ESTÁ VULNERÁVEL';
    this.scene.tip('NÚCLEO VULNERÁVEL! ATAQUE AGORA!');

    const dur = Phaser.Math.Between(3000, 6000);
    this.vulnEndTimer = this.scene.time.delayedCall(dur, () => {
      if (!this.active || this.dead) return;
      this.vulnerable = false;
      this.clearTint();
      this.cyclePhase2();
    });
  }
}
