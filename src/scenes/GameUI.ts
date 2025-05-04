import { io, Socket } from 'socket.io-client'
import { InventoryUI } from './InventoryUI'

export default class GameUI extends Phaser.Scene {

    socket: Socket
    pingText: Phaser.GameObjects.Text
    inventory: InventoryUI

    constructor(){
        super('GameUI')

        this.socket = io('http://localhost:3000', {
            transports: ['websocket']
        })
    }

    create(){

        this.pingText = this.add.text(100, 100, 'Ping: 0ms')

        setInterval(() => {
            const then = Date.now()
            this.socket.emit('ping', () => {
                const now = Date.now()
                this.pingText.setText('Ping: '+ (now-then)+'ms')
            })
        }, 1000)

        this.inventory = new InventoryUI(this)
        this.inventory.setVisible(false)

        const inventoryButton = this.add.text(960, 1000, 'Inventory', {
            fontSize: '32px',
            color: '#fff'
        }).setOrigin(0.5).setInteractive()

        inventoryButton.on('pointerdown', () => {
            this.inventory.setVisible(!this.inventory.visible)
        })
    }
}