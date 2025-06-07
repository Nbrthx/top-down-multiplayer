import { Socket } from 'socket.io-client';
import { GameUI } from '../../scenes/GameUI';

export class Chat extends Phaser.GameObjects.DOMElement {

    scene: GameUI
    socket: Socket
    submit: HTMLButtonElement | null
    chat: HTMLInputElement | null

    constructor(scene: GameUI, socket: Socket){
        super(scene, scene.scale.width/2, 10)

        scene.add.existing(this)

        this.scene = scene
        this.socket = socket

        this.createFromCache('chatbox').setName('chatbox')
        this.setScale(1.4).setOrigin(0.5, 0)

        this.submit = this.getChildByID('submit') as HTMLButtonElement
        this.chat = this.getChildByID('chat') as HTMLInputElement

        this.submit.addEventListener('pointerup', () => this.onSubmit())

        this.chat.onfocus = () => {
            if(scene.input.keyboard){
                scene.input.keyboard.enabled = false
                scene.input.keyboard.resetKeys()
            }
        }
        
        scene.input.on("pointerdown", () => {
            if(scene.input.keyboard) scene.input.keyboard.enabled = true
            this.chat?.blur()
        })
    }

    onSubmit(){
        this.scene.gameScene.player.textbox.writeText(this.chat?.value)
        this.socket.emit('chat', this.chat?.value)

        this.chat!.value = ''
        console.log('submit')
    }

    destroy(){
        super.destroy()
    }
}