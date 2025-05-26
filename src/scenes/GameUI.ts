import { Socket } from 'socket.io-client'
import { InventoryUI } from '../prefabs/InventoryUI'
import { HotbarUI } from '../prefabs/HotbarUI'
import { Game } from './Game'
import { socket } from './MainMenu'
import { Player } from '../prefabs/Player'
import { Joystick } from '../prefabs/Joystick'

export default class GameUI extends Phaser.Scene {

    socket: Socket
    pingText: Phaser.GameObjects.Text
    inventoryUI: InventoryUI
    hotbarUI: HotbarUI
    joystick: Joystick
    uiScale: number
    inventoryButton: Phaser.GameObjects.Text

    constructor(){
        super('GameUI')

        this.socket = socket
    }

    create(){
        this.uiScale = this.scale.width / 1920

        this.input.addPointer(2)

        this.pingText = this.add.text(100, 50, 'Ping: 0ms', {
            fontSize: 24, fontStyle: 'bold',
            color: '#fff'
        })

        setInterval(() => {
            const then = Date.now()
            this.socket.emit('ping', () => {
                const now = Date.now()
                this.pingText.setText('Ping: '+ (now-then)+'ms')
            })
        }, 1000)

        const GameScene = this.scene.get('Game') as Game

        this.inventoryButton = this.add.text(this.scale.width/2, 1000, 'INVENTORY', {
            fontSize: '32px', fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5).setInteractive()
        this.inventoryButton.on('pointerdown', () => {
            this.inventoryUI.setVisible(!this.inventoryUI.visible)
            this.hotbarUI.setVisible(!this.hotbarUI.visible)
            this.inventoryButton.setVisible(false)
        })

        GameScene.events.on('start', () => {
            this.scene.setVisible(true)
        })
        GameScene.events.on('shutdown', () => {
            this.scene.setVisible(false)
            this.hotbarUI.destroy()
            this.inventoryUI.destroy()
        })

        const debugToggle = this.add.text(this.scale.width - 50, 50, 'Debug?', {
            fontSize: 24, color: '#000000', fontStyle: 'bold'
        }).setOrigin(1, 0)
        debugToggle.setInteractive()
        debugToggle.on('pointerup', () => {
            GameScene.isDebug = !GameScene.isDebug
            GameScene.debugGraphics.clear()
        })

        const fullscreenToggle = this.add.text(this.scale.width - 250, 50, 'Fullscreen?', {
            fontSize: 24, color: '#000000', fontStyle: 'bold'
        }).setOrigin(1, 0)
        fullscreenToggle.setInteractive()
        fullscreenToggle.on('pointerup', () => {
            if (this.scale.isFullscreen){
                this.scale.stopFullscreen();
            }
            else{
                this.scale.startFullscreen();
            }
        })

        this.joystick = new Joystick({
            scene: this,
            x: 400, // Posisi untuk joystick statis
            y: this.cameras.main.height - 250,
            // baseTextureKey: 'joystick_base', // Opsional
            // knobTextureKey: 'joystick_knob', // Opsional
            size: 200,
            knobSize: 80,
            dynamic: true, // Coba true untuk joystick dinamis
            fixedToCamera: true, // Agar tetap di UI layer
        })
        this.joystick.setVisible(true)
    }

    setupInventory(player: Player){
        this.inventoryUI = new InventoryUI(this, player.inventory).setScale(this.uiScale)
        this.inventoryUI.setVisible(false)

        this.inventoryUI.background.on('pointerdown', () => {
            this.inventoryUI.setVisible(!this.inventoryUI.visible)
            this.hotbarUI.setVisible(!this.hotbarUI.visible)
            this.inventoryButton.setVisible(true)
        })

        this.hotbarUI = new HotbarUI(this, player.inventory).setScale(this.uiScale)

        player.inventory.onInventoryUpdate = () => {
            this.inventoryUI.updateItems()
            this.hotbarUI.createGrid(this.hotbarUI.hotbarContainer)
        }

        player.inventory.onInventorySwap = (index, index2) => {
            this.hotbarUI.createGrid(this.hotbarUI.hotbarContainer)

            const swap = { index, index2 }
            console.log(swap)

            this.socket.emit('updateInventory', swap)
        }

        player.inventory.onSetActiveIndex = () => {
            this.socket.emit('updateHotbar', player.inventory.activeIndex)
        }
    }
}