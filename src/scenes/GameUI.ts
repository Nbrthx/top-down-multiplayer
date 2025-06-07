import { Socket } from 'socket.io-client'
import { InventoryUI } from '../prefabs/ui/InventoryUI'
import { HotbarUI } from '../prefabs/ui/HotbarUI'
import { Game } from './Game'
import { socket } from './MainMenu'
import { Player } from '../prefabs/Player'
import { Joystick } from '../prefabs/Joystick'
import { Chat } from '../prefabs/ui/Chat'
import { StatsUI } from '../prefabs/ui/StatsUI'

export const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export class GameUI extends Phaser.Scene {

    socket: Socket
    debugText: Phaser.GameObjects.Text
    gameScene: Game

    inventoryUI: InventoryUI
    hotbarUI: HotbarUI
    statsUI: StatsUI

    keyboardInput: {
        up?: boolean
        down?: boolean
        left?: boolean
        right?: boolean
    }
    joystick: Joystick
    inventoryButton: Phaser.GameObjects.Image
    chatbox: Chat
    joystick2: Joystick

    constructor(){
        super('GameUI')

        this.socket = socket
    }

    create(){
        this.input.addPointer(2)

        this.debugText = this.add.text(100, 100, 'Ping: 0ms\nFPS: 0', {
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

        const bottomBox = this.add.rectangle(this.scale.width/2, this.scale.height, this.scale.width, 80, 0x111111, 0.6)
        bottomBox.setOrigin(0.5, 1)

        this.inventoryButton = this.add.image(this.scale.width/2, this.scale.height - 80, 'icon-inventory')
        this.inventoryButton.setScale(6).setInteractive()
        this.inventoryButton.on('pointerdown', () => {
            this.inventoryUI.setVisible(true)
            this.chatbox.setVisible(false)
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

        if(isMobile()){
            this.joystick = new Joystick({
                scene: this,
                x: 400,
                y: this.scale.height - 300,
                size: 320,
                knobSize: 120,
                baseTint: 0xeeccff,
                knobTint: 0x443355,
                dynamic: true,
            })

            this.joystick2 = new Joystick({
                scene: this,
                x: this.scale.width - 320,
                y: this.scale.height - 360,
                size: 260,
                knobSize: 80,
                baseTint: 0xffccee,
                knobTint: 0x553344,
            })

            this.joystick2.onPointerdown = () => {
                this.gameScene.player?.aimAssist.setVisible(true)
            }

            this.joystick2.onPointerup = () => {
                this.gameScene.player?.aimAssist.setVisible(false)
                this.gameScene.attackDir.x = this.joystick2.x
                this.gameScene.attackDir.y = this.joystick2.y
                this.gameScene.camera.setFollowOffset(0, 0)
            }
        }
    }

    update(){
        this.keyboardInput = {
            up: this.input.keyboard?.addKey('W', false)?.isDown,
            down: this.input.keyboard?.addKey('S', false)?.isDown,
            left: this.input.keyboard?.addKey('A', false)?.isDown,
            right: this.input.keyboard?.addKey('D', false)?.isDown
        }

        if(this.hotbarUI && this.hotbarUI instanceof HotbarUI) this.hotbarUI.update()

        if(this.statsUI && this.statsUI instanceof StatsUI && this.gameScene.player){
            this.statsUI.update(this.gameScene.player.stats)
        }

        if(isMobile() && this.joystick2){
            if(this.hotbarUI && this.hotbarUI instanceof HotbarUI && this.hotbarUI.isActiveIndexCooldown()) this.joystick2.setAlpha(1)
            else this.joystick2.setAlpha(0.2)

            if(this.joystick2.x != 0 || this.joystick2.y != 0){
                const x = this.joystick2.x
                const y = this.joystick2.y

                const rad = Math.atan2(y, x)
                this.gameScene.player.aimAssist.setRotation(rad)
                this.gameScene.camera.setFollowOffset(-x*40, -y*40)
            }
        }
    }

    setupUI(player: Player){
        this.statsUI = new StatsUI(this)

        this.hotbarUI = new HotbarUI(this, player.inventory)

        this.inventoryUI = new InventoryUI(this, player.inventory)
        this.inventoryUI.setVisible(false)

        this.inventoryUI.background.on('pointerdown', () => {
            this.inventoryUI.setVisible(false)
            this.chatbox.setVisible(true)
        })

        player.inventory.onInventoryUpdate = () => {
            this.inventoryUI.updateItems()
            this.hotbarUI.createGrid(this.hotbarUI.hotbarContainer)
        }

        player.inventory.onInventorySwap = (index, index2) => {
            this.hotbarUI.createGrid(this.hotbarUI.hotbarContainer)

            const swap = { index, index2 }
            console.log(swap)

            this.socket.emit('swapInventory', swap)
        }

        player.inventory.onSetActiveIndex = () => {
            this.socket.emit('setHotbarIndex', player.inventory.activeIndex)
        }

        player.inventory.onDropItem = (index, dir) => {
            this.socket.emit('dropItem', index, dir)
        }
    }
}