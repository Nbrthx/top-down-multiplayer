import { Scene } from 'phaser';

export class GameOver extends Scene{
    camera: Phaser.Cameras.Scene2D.Camera;
    gameover_text : Phaser.GameObjects.Text;

    constructor (){
        super('GameOver');
    }

    create (){
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0xff0000);

        this.gameover_text = this.add.text(this.scale.width/2, this.scale.height/2-80, 'Game Over', {
            fontFamily: 'PixelFont', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        let itr = 5

        const respawnText = this.add.text(this.scale.width/2, this.scale.height/2, 'Respawn in '+itr+'s', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5)

        const counting = () => {
            if(itr > 0){
                itr--
                respawnText.setText('Respawn in '+itr+'s')
                setTimeout(() => counting(), 1000)
                return
            }
            
            this.scene.start('MainMenu', { respawn: true });
        }
        counting()
    }
}
