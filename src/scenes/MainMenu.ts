import { Scene } from 'phaser';

export class MainMenu extends Scene{

    constructor (){
        super('MainMenu');
    }

    create (){
        const logo = this.add.image(1920-20, 1080-10, 'logo');
        logo.setOrigin(1)
        logo.setScale(0.4)

        this.add.text(960, 420, 'Insiace: Open-World', {
            fontFamily: 'PixelFont', fontSize: 96, color: '#ffffcc',
            stroke: '#330022', strokeThickness: 16,
            align: 'center'
        }).setOrigin(0.5);

        const play = this.add.text(960, 640, 'Play', {
            fontFamily: 'PixelFont', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);
        play.setInteractive()

        this.add.text(1920-230, 1080-10, 'Made with', {
            fontFamily: 'PixelFont', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(1);

        play.once('pointerdown', () => {

            this.scene.start('Game');

        });
    }
}
