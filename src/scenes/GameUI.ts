import { Socket } from 'socket.io-client'
import { InventoryUI } from '../prefabs/InventoryUI'
import { HotbarUI } from '../prefabs/HotbarUI'
import { Game } from './Game'
import { socket } from './MainMenu'
import { Player } from '../prefabs/Player'

export default class GameUI extends Phaser.Scene {

    socket: Socket
    pingText: Phaser.GameObjects.Text
    inventoryUI: InventoryUI
    hotbarUI: HotbarUI

    constructor(){
        super('GameUI')

        this.socket = socket
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

        const GameScene = this.scene.get('Game') as Game

        const inventoryButton = this.add.text(960, 1000, 'INVENTORY', {
            fontSize: '32px', fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5).setInteractive()

        inventoryButton.on('pointerdown', () => {
            this.inventoryUI.setVisible(!this.inventoryUI.visible)
            this.hotbarUI.setVisible(!this.hotbarUI.visible)
        })

        GameScene.events.on('start', () => {
            this.pingText.setVisible(true)
            inventoryButton.setVisible(true)
        })
        GameScene.events.on('shutdown', () => {
            this.pingText.setVisible(false)
            this.inventoryUI.destroy()
            this.hotbarUI.destroy()
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

    setupInventory(player: Player){
        this.inventoryUI = new InventoryUI(this, player.inventory)
        this.inventoryUI.setVisible(false)

        this.hotbarUI = new HotbarUI(this, player.inventory)

        player.inventory.onInventoryUpdate = () => {
            this.inventoryUI.updateItems()
            this.hotbarUI.createGrid(this.hotbarUI.hotbarContainer)
        }

        player.inventory.onInventorySwap = (index, index2) => {
            this.hotbarUI.createGrid(this.hotbarUI.hotbarContainer)

            const swap = { index, index2 }
            console.log(swap)

            this.socket.emit('updateInventory', 'world1', swap)
        }

        player.inventory.onSetActiveIndex = () => {
            this.socket.emit('updateHotbar', 'world1', player.inventory.activeIndex)
        }
    }
}