import { Socket } from 'socket.io-client'
import { InventoryUI } from '../prefabs/InventoryUI'
import { HotbarUI } from '../prefabs/HotbarUI'
import { Game } from './Game'
import { socket } from './MainMenu'
import { Player } from '../prefabs/Player'
import { Joystick } from '../prefabs/Joystick'
import { Chat } from '../components/Chat'

export default class GameUI extends Phaser.Scene {

    socket: Socket
    debugText: Phaser.GameObjects.Text
    gameScene: Game
    inventoryUI: InventoryUI
    hotbarUI: HotbarUI
    keyboardInput: {
        up?: boolean
        down?: boolean
        left?: boolean
        right?: boolean
    }
    joystick: Joystick
    uiScale: number
    inventoryButton: Phaser.GameObjects.Text
    chatbox: Chat
    cooldownText: Phaser.GameObjects.Text

    constructor(){
        super('GameUI')

        this.socket = socket
    }

    create(){
        this.uiScale = this.scale.width / 1920

        this.input.addPointer(2)

        this.debugText = this.add.text(100, 50, 'Ping: 0ms\nFPS: 0', {
            fontSize: 24, fontStyle: 'bold',
            color: '#fff'
        })

        setInterval(() => {
            const then = Date.now()
            this.socket.emit('ping', () => {
                const fps = Math.floor(this.game.loop.actualFps*100)/100
                const now = Date.now()
                this.debugText.setText('Ping: '+ (now-then)+'ms\nFPS: '+fps)
            })
        }, 1000)

        this.chatbox = new Chat(this, this.socket)

        this.gameScene = this.scene.get('Game') as Game

        this.inventoryButton = this.add.text(this.scale.width/2, 1000, 'INVENTORY', {
            fontSize: '32px', fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5).setInteractive()
        this.inventoryButton.on('pointerdown', () => {
            this.inventoryUI.setVisible(!this.inventoryUI.visible)
            this.hotbarUI.setVisible(!this.hotbarUI.visible)
            this.inventoryButton.setVisible(false)
        })

        this.gameScene.events.on('start', () => {
            this.scene.setVisible(true)
            this.chatbox = new Chat(this, this.socket)
        })
        this.gameScene.events.on('shutdown', () => {
            this.scene.setVisible(false)
            this.hotbarUI.destroy()
            this.inventoryUI.destroy()
            this.chatbox.destroy()
        })

        this.cooldownText = this.add.text(this.scale.width - 40, 880, 'Cooldown: 0.00s', {
            fontSize: 38,
            stroke: '#556677', strokeThickness: 4,
            fontFamily: 'PixelFont', letterSpacing: 2,
            color: '#fff'
        }).setOrigin(1, 0.5)


        const debugToggle = this.add.text(this.scale.width - 50, 50, 'Debug?', {
            fontSize: 24, color: '#000000', fontStyle: 'bold'
        }).setOrigin(1, 0)
        debugToggle.setInteractive()
        debugToggle.on('pointerup', () => {
            this.gameScene.isDebug = !this.gameScene.isDebug
            this.gameScene.debugGraphics.clear()
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

    update(){
        this.keyboardInput = {
            up: this.input.keyboard?.addKey('W', false)?.isDown,
            down: this.input.keyboard?.addKey('S', false)?.isDown,
            left: this.input.keyboard?.addKey('A', false)?.isDown,
            right: this.input.keyboard?.addKey('D', false)?.isDown
        }

        let cooldown = this.gameScene.player.itemInstance.timestamp+this.gameScene.player.itemInstance.cooldown-Date.now()
        if(cooldown <= 0){
            this.cooldownText.setColor('#33ff44')
            cooldown = 0
        }
        else{
            this.cooldownText.setColor('#ffffff')
        }
        this.cooldownText.setText('Cooldown: '+(cooldown/1000).toFixed(2)+'s')
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