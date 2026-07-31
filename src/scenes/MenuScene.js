import Phaser from "phaser";
import { Save } from "../systems/Save.js";

const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const GRID_SIZE = 64;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    this.drawBackground();
    this.createTitle();
    this.createButtons();
    this.createControls();
  }

  drawBackground() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x02040d);
    graphics.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    graphics.lineStyle(1, 0x17496c, 0.5);

    for (let x = 0; x < SCREEN_WIDTH; x += GRID_SIZE) {
      graphics.lineBetween(x, 0, x, SCREEN_HEIGHT);
    }
  }

  createTitle() {
    this.createLabel(
      110,
      "GUARDIÃO DE DADOS",
      58,
      "#31e8ff"
    );

    this.createLabel(
      170,
      "INVASÃO DIGITAL",
      30,
      "#a78bfa"
    );
  }

  createButtons() {
    this.createButton("JOGAR", 300, () => {
      this.scene.start("play", { index: 0 });
    });

    const state = Save.state();

    if (state.unlocked > 1) {
      this.createButton(
        `CONTINUAR: FASE ${state.unlocked}`,
        370,
        () => {
          this.scene.start("play", {
            index: state.unlocked - 1,
          });
        }
      );
    }
  }

  createControls() {
    this.createLabel(
      485,
      "A/D mover • W/ESPAÇO pular • MOUSE mirar e atirar • E terminal • ESC pausa • F tela cheia",
      17,
      "#bff8ff"
    );
  }

  createLabel(y, text, size, color = "#fff") {
    return this.add
      .text(640, y, text, {
        fontFamily: "monospace",
        fontSize: `${size}px`,
        fontStyle: "bold",
        color,
        align: "center",
      })
      .setOrigin(0.5);
  }

  createButton(text, y, callback) {
    return this.add
      .text(640, y, text, {
        fontFamily: "monospace",
        fontSize: "25px",
        color: "#fff",
        backgroundColor: "#0c2948",
        padding: {
          x: 28,
          y: 14,
        },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", callback);
  }
}