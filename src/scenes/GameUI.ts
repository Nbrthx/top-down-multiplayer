import { io, Socket } from 'socket.io-client'
import { Inventory } from '../prefabs/Inventory'
import { Hotbar } from '../prefabs/Hotbar'
import { Game } from './Game'

export default class GameUI extends Phaser.Scene {

    socket: Socket
    pingText: Phaser.GameObjects.Text
    inventory: Inventory
    hotbar: Hotbar

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

        this.inventory = new Inventory(this)
        this.inventory.setVisible(false)

        this.hotbar = new Hotbar(this, this.inventory.hotItems)

        this.inventory.onHotbarChange = () => {
            this.hotbar.createGrid(this.hotbar.hotbar)
        }

        const inventoryButton = this.add.text(960, 1000, 'Inventory', {
            fontSize: '32px',
            color: '#fff'
        }).setOrigin(0.5).setInteractive()

        inventoryButton.on('pointerdown', () => {
            this.inventory.setVisible(!this.inventory.visible)
            this.hotbar.setVisible(!this.hotbar.visible)
        })

        const GameScene = (this.scene.get('Game') || this.scene.add('Game', new Game(), true)) as Game

        GameScene.events.on('start', () => {
            this.pingText.setVisible(true)
            this.hotbar.setVisible(true)
            inventoryButton.setVisible(true)
        })
        GameScene.events.on('shutdown', () => {
            this.pingText.setVisible(false)
            this.inventory.setVisible(false)
            this.hotbar.setVisible(false)
            inventoryButton.setVisible(false)
        })

        const debugToggle = this.add.text(1870, 50, 'Debug?', {
            fontSize: 24, color: '#000000', fontStyle: 'bold'
        }).setOrigin(1, 0)
        debugToggle.setInteractive()
        debugToggle.on('pointerdown', () => {
            GameScene.isDebug = !GameScene.isDebug
            GameScene.debugGraphics.clear()
        })
    }
}