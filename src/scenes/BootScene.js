import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create() {
    this.graphics = this.make.graphics({ add: false });

    this.createHero();
    this.createEnemies();
    this.createProjectiles();
    this.createObjects();

    this.scene.start("menu");
  }

  generateTexture(key, width, height, draw) {
    this.graphics.clear();
    draw(this.graphics);
    this.graphics.generateTexture(key, width, height);
  }

  createHero() {
    this.generateTexture("hero", 46, 62, (g) => {
      g.fillStyle(0x08192f).fillRoundedRect(8, 13, 30, 43, 8);
      g.fillStyle(0x35eaff).fillRoundedRect(10, 2, 26, 21, 7);
      g.fillStyle(0xffffff).fillRect(15, 10, 16, 4);
      g.fillStyle(0x8b5cf6).fillRect(2, 25, 42, 13);
      g.fillStyle(0x22e39a).fillCircle(23, 33, 5);
      g.fillStyle(0x35eaff)
        .fillRect(6, 55, 12, 7)
        .fillRect(28, 55, 12, 7);
    });
  }

  createEnemies() {
    this.generateTexture("virus", 38, 34, (g) => {
      g.fillStyle(0xff356b).fillCircle(19, 17, 11);
      g.lineStyle(3, 0xff91a8);

      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;

        g.lineBetween(
          19,
          17,
          19 + Math.cos(angle) * 17,
          17 + Math.sin(angle) * 15
        );
      }
    });

    this.generateTexture("trojan", 42, 42, (g) => {
      g.fillStyle(0xffb020).fillRoundedRect(3, 8, 36, 31, 4);
      g.fillStyle(0xffe08a).fillRect(3, 8, 36, 8);
      g.fillStyle(0x071426).fillTriangle(21, 16, 12, 32, 30, 32);
    });

    this.generateTexture("spyware", 46, 34, (g) => {
      g.fillStyle(0x8b5cf6).fillEllipse(23, 17, 44, 28);
      g.fillStyle(0xffffff).fillCircle(23, 17, 10);
      g.fillStyle(0x071426).fillCircle(23, 17, 5);
    });

    this.generateTexture("phishing", 42, 38, (g) => {
      g.fillStyle(0x31e8ff).fillRoundedRect(3, 4, 36, 30, 5);
      g.fillStyle(0x071426)
        .fillRect(8, 10, 26, 3)
        .fillRect(8, 17, 18, 3);
    });

    this.generateTexture("ransomware", 44, 44, (g) => {
      g.fillStyle(0xaf173d).fillRoundedRect(3, 12, 38, 29, 5);
      g.lineStyle(5, 0xff91a8).strokeCircle(22, 13, 10);
      g.fillStyle(0x071426).fillCircle(22, 25, 5);
    });

    this.generateTexture("worm", 48, 28, (g) => {
      for (let i = 0; i < 4; i++) {
        g.fillStyle(i % 2 ? 0x22e39a : 0x35eaff)
          .fillCircle(9 + i * 10, 14, 8);
      }
    });

    this.generateTexture("boss", 76, 96, (g) => {
      g.fillStyle(0x3b1168).fillTriangle(38, 0, 3, 88, 73, 88);
      g.fillStyle(0x071426).fillCircle(38, 37, 27);
      g.lineStyle(4, 0xff356b).strokeCircle(38, 37, 21);
      g.fillStyle(0x35eaff)
        .fillRect(22, 31, 10, 5)
        .fillRect(44, 31, 10, 5);
    });
  }

  createProjectiles() {
    this.generateTexture("plasma", 20, 10, (g) => {
      g.fillStyle(0x35eaff, 0.7).fillEllipse(10, 5, 20, 10);
      g.fillStyle(0xffffff).fillEllipse(10, 5, 10, 4);
    });

    this.generateTexture("enemyShot", 14, 14, (g) => {
      g.fillStyle(0xff356b).fillCircle(7, 7, 7);
    });
  }

  createObjects() {
    this.generateTexture("terminal", 54, 72, (g) => {
      g.fillStyle(0x0c2948).fillRoundedRect(3, 3, 48, 66, 5);
      g.lineStyle(3, 0x35eaff).strokeRoundedRect(3, 3, 48, 66, 5);
      g.fillStyle(0x22e39a).fillRect(12, 14, 30, 28);
    });

    this.generateTexture("item", 26, 26, (g) => {
      g.fillStyle(0x22e39a).fillCircle(13, 13, 12);
      g.fillStyle(0xffffff)
        .fillRect(10, 4, 6, 18)
        .fillRect(4, 10, 18, 6);
    });
  }
}