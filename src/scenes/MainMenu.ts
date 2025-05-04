import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    mainText: GameObjects.Text;

    constructor (){
        super('MainMenu');
    }

    create (){
        this.logo = this.add.image(1920-20, 1080-10, 'logo');
        this.logo.setOrigin(1)
        this.logo.setScale(0.5)

        this.title = this.add.text(960, 420, 'Insiace: Open-World', {
            fontFamily: 'PixelFont', fontSize: 96, color: '#ffffcc',
            stroke: '#330022', strokeThickness: 16,
            align: 'center'
        }).setOrigin(0.5);

        this.mainText = this.add.text(960, 640, 'Main Menu', {
            fontFamily: 'PixelFont', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            this.scene.start('Game');

        });
    }
}
