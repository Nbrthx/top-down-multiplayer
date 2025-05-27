import { Socket } from 'socket.io-client';
import GameUI from '../scenes/GameUI';

export class Chat{

    scene: GameUI
    socket: Socket
    element: Phaser.GameObjects.DOMElement
    submit: HTMLButtonElement | null
    chat: HTMLInputElement | null

    constructor(scene: GameUI, socket: Socket){
        this.scene = scene
        this.socket = socket

        this.element = scene.add.dom(scene.scale.width/2, 40).createFromCache('chatbox').setName('chatbox')
        this.element.setScale(1.5)

        this.submit = this.element.getChildByID('submit') as HTMLButtonElement
        this.chat = this.element.getChildByID('chat') as HTMLInputElement

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
        this.element.destroy()
    }
}