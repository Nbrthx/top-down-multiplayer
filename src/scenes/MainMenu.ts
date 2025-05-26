import { Scene } from 'phaser';
import { io } from 'socket.io-client';
import { Authentication } from '../components/Authentication';

export const HOST_ADDRESS = 'http://localhost:3000'
export const socket = io(HOST_ADDRESS, { transports: ['websocket'] })

export class MainMenu extends Scene{

    constructor (){
        super('MainMenu');
    }

    create (){
        const authentication = new Authentication(this, socket)

        if(localStorage.getItem('username') && localStorage.getItem('salt')){
            authentication.login(localStorage.getItem('username') as string, '', true)
        }
        else{
            authentication.element.setVisible(true)
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

        const play = this.add.text(this.scale.width/2, 480, 'Play', {
            fontFamily: 'PixelFont', fontSize: 56, color: '#ffffff',
            stroke: '#000000', strokeThickness: 12,
            align: 'center'
        }).setOrigin(0.5);
        play.setInteractive()

        const logout = this.add.text(this.scale.width/2, 580, 'Logout', {
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

        play.once('pointerup', () => {
            if(authentication.element.visible) return

            this.scale.startFullscreen();

            this.scene.start('Game');
        });

        logout.on('pointerup', () => {
            localStorage.removeItem('username')
            localStorage.removeItem('salt')

            authentication.element.setVisible(true)

            socket.disconnect()
            socket.connect()
        })
    }
}
