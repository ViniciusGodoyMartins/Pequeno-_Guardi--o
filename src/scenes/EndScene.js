import Phaser from "phaser";
import { Save } from "../systems/Save.js";

const CENTER_X = 640;

export class EndScene extends Phaser.Scene {
  constructor() {
    super("end");
  }

  init(data) {
    this.data = data;
  }

  create() {
    this.cameras.main.setBackgroundColor("#02040d");

    const isFinalLevel = this.data.win && this.data.index === 4;

    this.createTitle(isFinalLevel);
    this.createMessage(isFinalLevel);
    this.createScore();
    this.createButtons(isFinalLevel);
  }

  createTitle(isFinalLevel) {
    let title;
    let color;

    if (this.data.win) {
      title = isFinalLevel
        ? "SISTEMA PROTEGIDO!"
        : "SETOR RESTAURADO";

      color = "#31e8ff";
    } else {
      title = "SOLDADO DESATIVADO";
      color = "#ff356b";
    }

    this.createLabel(130, title, 48, color);
  }

  createMessage(isFinalLevel) {
    const message = isFinalLevel
      ? `A melhor defesa começa com boas escolhas.
Pense antes de clicar, use senhas fortes e mantenha backups.`
      : this.data.tip;

    this.createLabel(260, message, 23);
  }

  createScore() {
    this.createLabel(
      360,
      `PONTOS ${this.data.score} • RECORDE ${Save.state().best}`,
      22,
      "#22e39a"
    );
  }

  createButtons(isFinalLevel) {
    if (this.data.win && !isFinalLevel) {
      this.createButton("PRÓXIMA FASE", 460, () => {
        this.scene.start("play", {
          index: this.data.index + 1,
        });
      });
    }

    this.createButton("JOGAR NOVAMENTE", 530, () => {
      this.scene.start("play", {
        index: this.data.index,
      });
    });

    this.createButton("MENU", 600, () => {
      this.scene.start("menu");
    });
  }

  createLabel(y, text, size, color = "#fff") {
    return this.add
      .text(CENTER_X, y, text, {
        fontFamily: "monospace",
        fontSize: `${size}px`,
        fontStyle: "bold",
        color,
        align: "center",
        wordWrap: {
          width: 1000,
        },
      })
      .setOrigin(0.5);
  }

  createButton(text, y, callback) {
    return this.add
      .text(CENTER_X, y, text, {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#0c2948",
        padding: {
          x: 25,
          y: 12,
        },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", callback);
  }
}