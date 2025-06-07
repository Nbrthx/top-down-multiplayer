import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';

import { Game, Types } from "phaser";

const ratio = screen.width>screen.height?screen.width/screen.height:screen.height/screen.width
let height = 1200

if(ratio > 16/10) height = 1080 
if(ratio > 16/9) height = 960 

let width = Math.max(Math.min(height*ratio, 2400), 1920)

const config: Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    width: width,
    height: height,
    parent: 'game-container',
    fullscreenTarget: 'game-container',
    backgroundColor: '#454449',
    pixelArt: true,
    roundPixels: true,
    disableContextMenu: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true
    },
    input: {
        activePointers: 2, // Untuk multi-touch
        touch: {
            capture: true
        }
    },
    dom: {
        createContainer: true
    },
    audio: {
        disableWebAudio: false
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ]
};

export default new Game(config);

document.addEventListener('contextmenu', event => event.preventDefault())
document.addEventListener("keydown", function(event) {
  if (event.key === "F11") {
    event.preventDefault();
  }
})
