import Phaser from 'phaser';
import './style.css';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PlayScene } from './scenes/PlayScene.js';
import { EndScene } from './scenes/EndScene.js';

// Em muitos navegadores mobile o CSS (100%/100dvh) não desconta direito o
// espaço da barra de endereço, fazendo o jogo "vazar" para baixo da tela
// visível sem como rolar até lá. Calculamos a altura real via JS
// (window.innerHeight sempre exclui a barra do navegador) ANTES de criar
// o jogo, e reaplicamos sempre que a tela girar ou a barra aparecer/sumir.
function fitGameContainer() {
  const el = document.getElementById('game');
  if (el) el.style.height = window.innerHeight + 'px';
}
fitGameContainer();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#02040d',
  pixelArt: true,
  roundPixels: true,
  disableContextMenu: true,
  input: {
    activePointers: 3
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
    fullscreenTarget: 'game'
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1500 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, PlayScene, EndScene]
});

function refit() {
  fitGameContainer();
  game.scale.refresh();
}
window.addEventListener('resize', refit);
window.addEventListener('orientationchange', () => setTimeout(refit, 150));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', refit);
}
