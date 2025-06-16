import { Scene } from 'phaser';
import { Authentication } from '../prefabs/ui/Authentication';

export const HOST_ADDRESS = 'http://localhost:3000'

export class MainMenu extends Scene{

    respawn: boolean = false

    constructor (){
        super('MainMenu');
    }

    init(data: { respawn: boolean }){
        this.respawn = data.respawn
    }

    create (){
        const authentication = new Authentication(this)

        if(localStorage.getItem('username') && localStorage.getItem('salt')){
            authentication.login(localStorage.getItem('username') as string, '', true)
        }
        else{
            authentication.setVisible(true)
        }

        const bg = this.add.image(this.scale.width/2, this.scale.height/2, 'bg')
        bg.setScale(0.75*(this.scale.width/this.scale.height > 2 ? this.scale.width/this.scale.height : 2));

        const logo = this.add.image(this.scale.width-20, this.scale.height-10, 'logo');
        logo.setOrigin(1)
        logo.setScale(0.4)

        this.add.text(this.scale.width/2, 160, 'Insiace: Survival World', {
            fontFamily: 'PixelFont', fontSize: 128, color: '#ffffcc',
            stroke: '#290f00', strokeThickness: 16,
            align: 'center'
        }).setOrigin(0.5);

        const play = this.add.text(this.scale.width/2, this.scale.height/2, 'Play', {
            fontFamily: 'PixelFont', fontSize: 56, color: '#ffffff',
            stroke: '#000000', strokeThickness: 12,
            align: 'center'
        }).setOrigin(0.5);
        play.setInteractive()

        const logout = this.add.text(this.scale.width/2, this.scale.height/2+100, 'Logout', {
            fontFamily: 'PixelFont', fontSize: 56, color: '#ffffff',
            stroke: '#000000', strokeThickness: 12,
            align: 'center'
        }).setOrigin(0.5);
        logout.setInteractive()

        this.add.text(this.scale.width-230, this.scale.height-10, 'Made with', {
            fontFamily: 'PixelFont', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(1);

        play.on('pointerup', () => {
            if(authentication.visible) return
            if(authentication.socket && authentication.socket.disconnected){
                alert('Not connected try to reload')
                authentication.socket.disconnect()
                this.scene.restart()
                return
            }

            this.scale.startFullscreen();

            this.scene.start('Game');
        });

        logout.on('pointerup', () => {
            localStorage.removeItem('username')
            localStorage.removeItem('salt')

            authentication.setVisible(true)

            authentication.socket.disconnect()
        })

        if(this.respawn) this.scene.start('Game');
    }
}
