import { Socket } from 'socket.io-client';
import { GameUI } from '../../scenes/GameUI';

export class Chat extends Phaser.GameObjects.DOMElement {

    scene: GameUI
    socket: Socket
    submit: HTMLButtonElement
    chat: HTMLInputElement

    constructor(scene: GameUI, socket: Socket){
        super(scene, scene.scale.width/2, 10)

        scene.add.existing(this)

        this.scene = scene
        this.socket = socket

        this.createFromCache('chatbox').setName('chatbox')
        this.setScale(1.4).setOrigin(0.5, 0)

        this.chat = this.getChildByID('chat') as HTMLInputElement
        this.submit = this.getChildByID('submit') as HTMLButtonElement

        this.submit.addEventListener('pointerup', () => this.onSubmit())
        this.chat.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter') this.onSubmit()
        })

        this.chat.onfocus = () => {
            if(scene.input.keyboard){
                scene.input.keyboard.enabled = false
                scene.input.keyboard.resetKeys()
            }
        }
        
        scene.gameScene?.input.on("pointerdown", () => {
            if(scene.input.keyboard) scene.input.keyboard.enabled = true
            this.setVisible(false)
        })
    }

    onSubmit(){
        this.socket.emit('chat', this.chat?.value)

        this.chat!.value = ''
        console.log('submit')

        this.chat.blur()
        if(this.scene.input.keyboard) this.scene.input.keyboard.enabled = true
    }

    setVisible(value: boolean): this {
        if(value){
            this.scene.chatTexts.setVisible(true)
            this.scene.chatNames.setVisible(true)
            this.scene.chatbox.setVisible(true)
            setTimeout(() => this.chat.focus(), 50)
        }
        else{
            this.scene.chatTexts.setVisible(false)
            this.scene.chatNames.setVisible(false)
            this.scene.chatbox.setVisible(false)
        }

        super.setVisible(value)
        return this
    }

    destroy(){
        super.destroy()
    }
}