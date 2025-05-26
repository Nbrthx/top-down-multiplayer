import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';

import { Game, Types } from "phaser";

const width = screen.width>screen.height?screen.width/screen.height:screen.height/screen.width

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: Math.max(Math.min(1080*width, 2400), 1440),
    height: 1080,
    parent: 'game-container',
    backgroundColor: '#454449',
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
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
