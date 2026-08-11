import Phaser from 'phaser';
import { LEVELS, TIPS } from '../data/levels.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Audio } from '../systems/Audio.js';
import { Save } from '../systems/Save.js';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  init(d) {
    this.index = Math.max(0, Math.min(5, d.index || 0));
    this.level = LEVELS[this.index];
  }

  create() {
    this.score = 0;
    this.terminalOn = false;
    this.ended = false;
    this.remainingThreats = 0;
    this.bossWaveRemaining = 0;
    this.overloaded = false;
    this.audio = new Audio();
    this.terminal = null;
    this.prompt = null;
    this.item = null;
    this.boss = null;
    this.pauseBox = null;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJumpQueued = false;
    this.touchFire = false;

    // Detecta celular/tablet (com toque) para exibir os controles na tela.
    // No PC (desktop) esses controles nunca aparecem. iPads modernos se
    // identificam como "desktop" no Safari, então usamos maxTouchPoints
    // como reforço pra não escondar os controles nesse caso.
    const device = this.sys.game.device;
    const tabletDisguisedAsDesktop = device.os.macOS && navigator.maxTouchPoints > 1;
    this.isMobile = (!device.os.desktop || tabletDisguisedAsDesktop) && device.input.touch;

    if (this.level.bossFight) {
      this.worldWidth = 1280;
      this.objective = 'SOBREVIVA AO NÚCLEO';
      this.createBossArena();
    } else {
      this.worldWidth = 2500;
      this.objective = 'ELIMINE AS AMEAÇAS';
      this.createNormalLevel();
    }

    this.commonSetup();

    // A mensagem de transição e o início da luta só podem acontecer
    // depois do commonSetup(), pois é ele quem cria o HUD (this.msg)
    // usado por tip(). Chamar antes disso travava o jogo na troca de fase.
    if (this.level.bossFight) {
      this.tip('O Hacker escapou! Ele retorna mais forte...');
      this.time.delayedCall(1600, () => this.startBoss(2));
    }
  }

  // ---------- Setup compartilhado por todas as fases ----------
  commonSetup() {
    this.bullets = this.physics.add.group({ maxSize: 40, allowGravity: false });
    this.enemyBullets = this.physics.add.group({ maxSize: 40, allowGravity: false });

    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.collider(this.bullets, this.platforms, b => this.stopBullet(b, true));
    this.physics.add.collider(this.enemyBullets, this.platforms, b => this.stopBullet(b));
    this.physics.add.overlap(this.player, this.enemyBullets, (p, b) => {
      this.stopBullet(b);
      this.hurt();
    });
    this.physics.add.overlap(this.player, this.enemies, () => this.hurt());

    if (this.item) {
      this.physics.add.overlap(this.player, this.item, () => {
        if (this.item.active) {
          this.item.disableBody(true, true);
          this.player.hp = Math.min(6, this.player.hp + 2);
        }
      });
    }

    // No PC, clicar em qualquer lugar da tela mira e atira (botão direito
    // fica desativado). No celular isso fica a cargo do botão de tiro
    // dedicado, pra não disparar sem querer ao tocar nos outros controles.
    if (!this.isMobile) this.input.on('pointerdown', this.fire, this);
    this.input.keyboard.on('keydown-E', this.interact, this);
    this.input.keyboard.on('keydown-ESC', () => this.pause());
    this.input.keyboard.on('keydown-F', () => this.scale.isFullscreen ? this.scale.stopFullscreen() : this.scale.startFullscreen());
    ['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT'].forEach(k => this.input.keyboard.on('keydown-' + k, e => e.preventDefault()));

    this.makeHud();
    this.tip(this.level.tip);

    if (this.isMobile) this.createTouchControls();
  }

  // ---------- Controles na tela para celular ----------
  createTouchControls() {
    this.touchUI = [];

    const btn = (x, y, r, label, fontSize, onDown, onUp) => {
      const c = this.add.circle(x, y, r, 0x0c2948, 0.55).setStrokeStyle(3, 0x35eaff, 0.85)
        .setScrollFactor(0).setDepth(90).setInteractive();
      const t = this.add.text(x, y, label, {
        fontFamily: 'monospace', fontSize: fontSize + 'px', fontStyle: 'bold', color: '#fff'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(91);
      c.on('pointerdown', onDown);
      c.on('pointerup', onUp);
      c.on('pointerout', onUp);
      this.touchUI.push(c, t);
      return { circle: c, label: t };
    };

    // Movimento (esquerda/direita) - canto inferior esquerdo
    btn(95, 630, 56, '◀', 30, () => this.touchLeft = true, () => this.touchLeft = false);
    btn(220, 630, 56, '▶', 30, () => this.touchRight = true, () => this.touchRight = false);

    // Pular e atirar - canto inferior direito
    btn(1160, 645, 58, 'PULAR', 15, () => this.touchJumpQueued = true, () => {});
    btn(1160, 505, 62, 'TIRO', 17, () => this.touchFire = true, () => this.touchFire = false);

    // Pausa - canto superior direito (não existe tecla ESC no celular)
    btn(1240, 32, 30, '❚❚', 15, () => this.pause(), () => {});

    // Interagir com o terminal - só existe em fases que têm terminal, e só
    // fica visível quando o player está perto dele (ver update()).
    if (this.terminal) {
      const ib = btn(640, 655, 58, 'E', 32, () => this.interact(), () => {});
      this.interactCircle = ib.circle;
      this.interactLabel = ib.label;
      this.interactCircle.setVisible(false);
      this.interactLabel.setVisible(false);
    }
  }

  setTouchVisible(v) {
    if (this.touchUI) this.touchUI.forEach(o => o.setVisible(v));
  }

  draw(width) {
    const g = this.add.graphics();
    g.fillStyle(0x02040d).fillRect(0, 0, width, 720);
    g.lineStyle(2, this.level.color, 0.28);
    for (let x = 0; x < width; x += 90) g.lineBetween(x, 0, x, 720);
  }

  makeHud() {
    const s = { fontFamily: 'monospace', fontSize: '19px', color: '#fff', stroke: '#02040d', strokeThickness: 5 };
    this.hud = this.add.text(20, 16, '', s).setScrollFactor(0).setDepth(50);
    this.msg = this.add.text(640, 110, '', {
      ...s, fontSize: '21px', backgroundColor: '#071426dd', padding: { x: 16, y: 9 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    this.bossBar = this.add.rectangle(427, 68, 426, 12, 0xff356b).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51).setVisible(false);

    // Barra que mostra o quanto a arma esquentou
    this.heatLabel = this.add.text(20, 44, 'ARMA', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9fd8ff', stroke: '#02040d', strokeThickness: 4
    }).setScrollFactor(0).setDepth(50);
    this.heatBarBg = this.add.rectangle(20, 64, 200, 14, 0x071426, 0.85)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(50).setStrokeStyle(2, 0x35eaff, 0.8);
    this.heatBar = this.add.rectangle(23, 64, 0, 10, 0x35eaff)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
  }

  // ---------- Fases normais (1 a 5) ----------
  createNormalLevel() {
    const L = this.level.layout;

    // Física com fundo mais profundo que a tela: permite que o player
    // realmente caia nos buracos até a checagem de morte (y > 760).
    this.physics.world.setBounds(0, 0, 2500, 900);
    this.cameras.main.setBounds(0, 0, 2500, 720);
    this.draw(2500);

    this.platforms = this.physics.add.staticGroup();
    [...L.ground, ...L.floating].forEach(v => {
      const r = this.add.rectangle(...v, this.level.color, 0.18).setStrokeStyle(3, this.level.color);
      this.physics.add.existing(r, true);
      this.platforms.add(r);
    });

    this.player = new Player(this, 90, 590);
    this.physics.add.collider(this.player, this.platforms);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -170, 50);

    this.enemies = this.physics.add.group();

    // "Ponte" invisível que somente os inimigos colidem: usa a MESMA
    // altura/posição do chão visível (y=680, h=80) mas cobrindo a largura
    // toda, inclusive os buracos. Assim os inimigos nunca chegam a cair -
    // eles simplesmente não afundam, ficando sempre no nível do chão.
    const enemyFloor = this.add.rectangle(1250, 680, 2500, 80, 0x000000, 0);
    this.physics.add.existing(enemyFloor, true);
    this.enemyFloor = enemyFloor;
    this.physics.add.collider(this.enemies, this.enemyFloor);

    this.level.enemies.forEach((k, i) => {
      const p = L.spawns[i % L.spawns.length];
      this.spawnEnemy(p[0], p[1], k, true);
    });

    this.terminal = this.physics.add.staticSprite(L.terminal[0], L.terminal[1], 'terminal');
    this.prompt = this.add.text(L.terminal[0], L.terminal[1] - 75, '', {
      fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: '#fff', backgroundColor: '#071426',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5);
    this.item = this.physics.add.staticSprite(L.item[0], L.item[1], 'item');
  }

  // ---------- Fase 6 - Arena exclusiva do boss ----------
  createBossArena() {
    this.physics.world.setBounds(0, 0, 1280, 900);
    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.draw(1280);

    this.platforms = this.physics.add.staticGroup();
    [
      [640, 690, 1280, 60],
      [220, 560, 220, 20], [1060, 560, 220, 20], [640, 470, 240, 20]
    ].forEach(v => {
      const r = this.add.rectangle(...v, this.level.color, 0.18).setStrokeStyle(3, this.level.color);
      this.physics.add.existing(r, true);
      this.platforms.add(r);
    });

    this.player = new Player(this, 640, 600);
    this.physics.add.collider(this.player, this.platforms);
    // Arena cabe inteira na tela: câmera fixa, sem necessidade de seguir o player
    this.cameras.main.stopFollow();

    this.enemies = this.physics.add.group();

    // Pontos onde os sentinelas podem ficar: as duas plataformas laterais
    // e a plataforma central elevada.
    this.sentryPlatforms = [[220, 530], [1060, 530], [640, 440]];
    this.sentinels = [];
  }

  // Chamado a cada ciclo do boss (fase 6): coloca 1 ou 2 sentinelas em
  // plataformas livres, escolhidas aleatoriamente, nunca repetindo uma
  // plataforma já ocupada por outro sentinela ativo.
  spawnSentinels() {
    const alive = this.sentinels.filter(s => s.active);
    const used = new Set(alive.map(s => s.platformIndex));
    const free = this.sentryPlatforms.map((_, i) => i).filter(i => !used.has(i));
    Phaser.Utils.Array.Shuffle(free);
    const n = Math.min(Phaser.Math.Between(1, 2), free.length);

    for (let i = 0; i < n; i++) {
      const idx = free[i];
      const spot = this.sentryPlatforms[idx];
      const s = this.spawnEnemy(spot[0], spot[1], 'sentinel', false);
      if (!s) continue;
      s.body.setAllowGravity(false);
      s.body.moves = false;
      s.platformIndex = idx;
      s.fromBossWave = true;
      this.bossWaveRemaining++;
      s.relocateTimer = this.time.addEvent({
        delay: 8000,
        loop: true,
        callback: () => this.relocateSentinel(s)
      });
      this.sentinels.push(s);
    }
  }

  // A cada 8s, o sentinela troca de plataforma - sempre para uma que não
  // esteja ocupada por outro sentinela vivo no momento.
  relocateSentinel(s) {
    if (!s.active || this.ended) return;
    const others = this.sentinels.filter(o => o.active && o !== s).map(o => o.platformIndex);
    const free = this.sentryPlatforms.map((_, i) => i).filter(i => i !== s.platformIndex && !others.includes(i));
    if (!free.length) return;
    const idx = Phaser.Utils.Array.GetRandom(free);
    const spot = this.sentryPlatforms[idx];
    this.tweens.add({
      targets: s, alpha: 0, duration: 200, onComplete: () => {
        if (!s.active) return;
        s.setPosition(spot[0], spot[1]);
        s.platformIndex = idx;
        this.tweens.add({ targets: s, alpha: 1, duration: 200 });
      }
    });
  }

  spawnEnemy(x, y, k, count = true) {
    if (this.ended) return null;
    const e = new Enemy(this, x, y, k);
    e.countForTerminal = count;
    this.enemies.add(e);
    this.physics.add.collider(e, this.platforms);
    if (count) this.remainingThreats++;
    return e;
  }

  update(t, d) {
    if (this.ended || this.pauseBox) return;
    this.player.update(t, d);

    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.counted) return;
      if (e.y > 760 || e.x < -100 || e.x > this.worldWidth + 100) {
        e.setPosition(Phaser.Math.Clamp(e.x, 150, this.worldWidth - 150), 500);
        e.setVelocity(0);
      }
      e.ai(this.player, t);
    });

    if (this.terminal) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.terminal.x, this.terminal.y);
      const near = !this.terminalOn && dist <= 155;
      this.prompt.setText(near ? (this.remainingThreats === 0 ? 'PRESSIONE E' : `${this.remainingThreats} AMEAÇA(S) RESTANTE(S)`) : '');
      if (this.interactCircle) {
        this.interactCircle.setVisible(near);
        this.interactLabel.setVisible(near);
      }
    }

    this.hud.setText(`VIDA ${'◆'.repeat(Math.max(0, this.player.hp))}${'◇'.repeat(Math.max(0, 6 - this.player.hp))}  •  ${this.level.title}  •  ${this.objective}  •  PONTOS ${this.score}`);

    // Barra de calor da arma
    const heatPct = Phaser.Math.Clamp(this.player.heat / 100, 0, 1);
    this.heatBar.width = 194 * heatPct;
    this.heatBar.fillColor = this.player.overheated ? 0xff356b : (heatPct > 0.75 ? 0xffb020 : 0x35eaff);
    this.heatBarBg.setStrokeStyle(2, this.player.overheated ? 0xff356b : 0x35eaff, 0.8);
    this.heatLabel.setText(this.player.overheated ? 'ARMA SUPERAQUECIDA!' : 'ARMA');
    this.heatLabel.setColor(this.player.overheated ? '#ff356b' : '#9fd8ff');

    // Buracos matam o player (mas nunca os inimigos, que ficam apoiados no piso invisível)
    if (this.player.y > 760) this.fail();

    // Tiro automático enquanto o botão de TIRO do celular estiver pressionado
    if (this.isMobile && this.touchFire) this.fire();
  }

  // Ângulo de mira: no PC segue o mouse; no celular mira automaticamente
  // no inimigo/boss mais próximo (sem mouse pra apontar manualmente).
  aimAngle() {
    if (this.isMobile) {
      const target = this.nearestTarget();
      if (target) return Phaser.Math.Angle.Between(this.player.x, this.player.y - 10, target.x, target.y);
      return this.player.facing > 0 ? 0 : Math.PI;
    }
    const q = this.input.activePointer.positionToCamera(this.cameras.main);
    return Phaser.Math.Angle.Between(this.player.x, this.player.y - 10, q.x, q.y);
  }

  nearestTarget() {
    let best = null, bestD = Infinity;
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.counted) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (dist < bestD) { bestD = dist; best = e; }
    });
    if (this.boss && this.boss.active && !this.boss.dead) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
      if (dist < bestD) { bestD = dist; best = this.boss; }
    }
    return best;
  }

  fire(pointer) {
    if (this.ended || this.pauseBox) return;
    // Botão direito desativado: só o botão esquerdo (ou toque) dispara
    if (pointer && pointer.leftButtonDown && !pointer.leftButtonDown()) return;
    if (!this.overloaded && (this.player.overheated || this.time.now < this.player.nextShot)) return;
    if (this.overloaded && this.time.now < this.player.nextShot) return;

    const cd = this.index >= 2 ? 130 : 190;
    this.player.nextShot = this.time.now + cd;
    if (!this.overloaded) {
      const heatCost = this.index >= 2 ? 10 : 15;
      this.player.heat = Math.min(110, this.player.heat + heatCost);
      if (this.player.heat >= 100) this.player.overheated = true;
    }

    const baseA = this.aimAngle();
    const dmg = this.index >= 1 ? 2 : 1;
    const offsets = this.index >= 4 ? [-0.13, 0, 0.13] : [0];

    offsets.forEach(off => {
      const a = baseA + off, x = this.player.x + Math.cos(a) * 32, y = this.player.y - 10;
      const b = this.bullets.get(x, y, 'plasma');
      if (!b) return;
      b.setDataEnabled();
      b.setData({ used: false, damage: dmg, hitIds: new Set() });
      b.enableBody(true, x, y, true, true);
      b.body.setAllowGravity(false);
      this.physics.velocityFromRotation(a, 760, b.body.velocity);
      b.setRotation(a);
      this.time.delayedCall(1300, () => b.active && this.stopBullet(b));
    });

    this.audio.play('shot');
  }

  stopBullet(b, fx = false) {
    if (!b?.active || b.getData('used')) return;
    b.setData('used', true);
    const x = b.x, y = b.y;
    b.body.stop();
    b.disableBody(true, true);
    if (fx) this.impact(x, y);
  }

  hitEnemy(b, e) {
    if (!b?.active || b.getData('used') || !e?.active || e.counted) return;
    const hitIds = b.getData('hitIds');
    if (hitIds) {
      if (hitIds.has(e)) return;
      hitIds.add(e);
    }
    this.impact(e.x, e.y);
    e.take(b.getData('damage') || 1);
    if (this.index < 3) this.stopBullet(b);
  }

  killEnemy(e) {
    if (!e || e.counted) return;
    e.counted = true;
    const k = e.kind, x = e.x, y = e.y;
    e.setActive(false).setVisible(false);
    if (e.body) {
      e.body.stop();
      e.body.enable = false;
    }
    if (e.countForTerminal) this.remainingThreats = Math.max(0, this.remainingThreats - 1);
    this.score += e.points;
    this.impact(x, y);
    this.tip(TIPS[k] || 'Ameaça eliminada.');
    this.time.delayedCall(0, () => e.destroy());

    if (this.sentinels) {
      const si = this.sentinels.indexOf(e);
      if (si !== -1) {
        if (e.relocateTimer) e.relocateTimer.remove();
        this.sentinels.splice(si, 1);
      }
    }

    if (e.fromBossWave) {
      this.bossWaveRemaining = Math.max(0, this.bossWaveRemaining - 1);
      if (this.bossWaveRemaining === 0 && this.boss && this.boss.active && !this.boss.dead) {
        this.boss.onWaveCleared();
      }
    }

    if (this.terminal && this.remainingThreats === 0 && !this.terminalOn) {
      this.objective = 'ATIVE O TERMINAL COM E';
      this.terminal.setTint(0x22e39a);
      this.tweens.add({ targets: this.terminal, alpha: 0.65, duration: 450, yoyo: true, repeat: -1 });
      this.tip('Área protegida. Aproxime-se do terminal e pressione E.');
    }
  }

  enemyFire(from, to, off = 0) {
    if (!from?.active || !to?.active) return;
    const a = Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y) + off;
    const b = this.enemyBullets.get(from.x, from.y, 'enemyShot');
    if (!b) return;
    b.setDataEnabled();
    b.setData('used', false);
    b.enableBody(true, from.x, from.y, true, true);
    b.body.setAllowGravity(false);
    this.physics.velocityFromRotation(a, 290, b.body.velocity);
    this.time.delayedCall(2400, () => b.active && this.stopBullet(b));
  }

  interact() {
    if (this.ended || this.terminalOn || !this.terminal) return;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.terminal.x, this.terminal.y);
    if (dist > 155) return;
    if (this.remainingThreats > 0) {
      this.tip(`Elimine as ameaças restantes: ${this.remainingThreats}.`);
      return;
    }
    this.terminalOn = true;
    this.tweens.killTweensOf(this.terminal);
    this.terminal.setAlpha(1).setTint(0x22e39a);
    this.score += 500;
    if (this.index === 4) this.overloaded = true;
    this.audio.play('terminal');
    this.tip(`Melhoria liberada: ${this.level.upgrade}`);
    if (this.index === 4) this.time.delayedCall(700, () => this.startBoss(1));
    else this.time.delayedCall(1200, () => this.completeLevel());
  }

  startBoss(phase = 1) {
    this.objective = phase === 2 ? 'DERROTE O NÚCLEO DO HACKER' : 'DERROTE O HACKER';
    const pos = phase === 2 ? [640, 150] : [2200, 450];
    this.boss = new Boss(this, pos[0], pos[1], phase);
    this.bossBar.setVisible(true);
    this.physics.add.overlap(this.bullets, this.boss, (o1, o2) => {
      const h = o1 === this.boss ? o1 : o2, b = o1 === this.boss ? o2 : o1;
      if (!b || !b.active || b.getData('used') || !h || !h.active) return;
      const x = b.x, y = b.y, d = b.getData('damage') || 1;
      this.stopBullet(b);
      const ok = h.damage(d);
      this.impact(x, y);
      if (!ok && !h.dead) this.tip('Espere o hacker ficar vulnerável.');
    });
  }

  beginBossWave(count) {
    this.bossWaveRemaining = count;
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(240 * i, () => {
        if (this.ended || !this.boss || !this.boss.active || this.boss.dead) return;
        const x = Phaser.Math.Between(120, 1160);
        const kinds = ['virus', 'worm', 'trojan', 'spyware'];
        const k = Phaser.Utils.Array.GetRandom(kinds);
        const e = this.spawnEnemy(x, 120, k, false);
        if (e) e.fromBossWave = true;
      });
    }
    this.spawnSentinels();
  }

  updateBoss() {
    this.bossBar.width = 426 * Math.max(0, this.boss.hp / this.boss.maxHp);
  }

  bossFled() {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    const st = Save.state();
    const unlocked = Math.max(st.unlocked, Math.min(6, this.index + 2));
    Save.patch({ unlocked });
    this.time.delayedCall(200, () => this.scene.start('play', { index: 5 }));
  }

  impact(x, y) {
    this.audio.play('hit');
    for (let i = 0; i < 4; i++) {
      const p = this.add.rectangle(x, y, 4, 4, this.level.color);
      this.tweens.add({
        targets: p, x: x + Phaser.Math.Between(-24, 24), y: y + Phaser.Math.Between(-24, 24),
        alpha: 0, duration: 200, onComplete: () => p.destroy()
      });
    }
  }

  hurt() {
    if (this.player.damage()) {
      this.audio.play('hurt');
      if (this.player.hp <= 0) this.fail();
    }
  }

  tip(t) {
    this.msg.setText(t).setAlpha(1);
    this.tweens.killTweensOf(this.msg);
    this.tweens.add({ targets: this.msg, alpha: 0, delay: 2800, duration: 300 });
  }

  completeLevel() {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    const st = Save.state();
    const unlocked = Math.max(st.unlocked, Math.min(6, this.index + 2));
    const best = Math.max(st.best, this.score);
    Save.patch({ unlocked, best });
    this.audio.play('win');
    this.time.delayedCall(600, () => this.scene.start('end', { win: true, index: this.index, score: this.score, tip: this.level.tip }));
  }

  fail() {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    const st = Save.state();
    const best = Math.max(st.best, this.score);
    Save.patch({ best });
    this.audio.play('lose');
    this.time.delayedCall(400, () => this.scene.start('end', { win: false, index: this.index, score: this.score, tip: this.level.tip }));
  }

  pause() {
    if (this.pauseBox) {
      this.resumeGame();
      return;
    }
    this.physics.pause();
    this.time.paused = true;
    this.tweens.pauseAll();
    this.setTouchVisible(false);

    const items = [];
    const panel = this.add.rectangle(640, 360, 460, 380, 0x02040d, 0.93)
      .setStrokeStyle(3, this.level.color).setScrollFactor(0).setDepth(100);
    items.push(panel);

    const title = this.add.text(640, 210, 'PAUSADO', {
      fontFamily: 'monospace', fontSize: '34px', fontStyle: 'bold', color: '#fff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    items.push(title);

    const btn = (y, t, cb) => {
      const o = this.add.text(640, y, t, {
        fontFamily: 'monospace', fontSize: '22px', color: '#fff', backgroundColor: '#0c2948',
        padding: { x: 22, y: 12 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', cb);
      items.push(o);
      return o;
    };

    btn(300, 'CONTINUAR', () => this.resumeGame());
    btn(370, 'REINICIAR', () => this.scene.start('play', { index: this.index }));
    btn(440, 'VOLTAR AO MENU', () => this.scene.start('menu'));

    this.pauseBox = { destroy: () => items.forEach(o => o.destroy()) };
  }

  resumeGame() {
    if (!this.pauseBox) return;
    this.pauseBox.destroy();
    this.pauseBox = null;
    this.physics.resume();
    this.time.paused = false;
    this.tweens.resumeAll();
    this.setTouchVisible(true);
  }
}
