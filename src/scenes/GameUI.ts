import { Socket } from 'socket.io-client'
import { InventoryUI } from '../prefabs/ui/InventoryUI'
import { HotbarUI } from '../prefabs/ui/HotbarUI'
import { Game } from './Game'
import { Player } from '../prefabs/Player'
import { Joystick } from '../prefabs/Joystick'
import { Chat } from '../prefabs/ui/Chat'
import { StatsUI } from '../prefabs/ui/StatsUI'
import { QuestUI } from '../prefabs/ui/QuestUI'
import { OutfitUI } from '../prefabs/ui/OutfitUI'
import { AlertBoxUI } from '../prefabs/ui/AlertBoxUI'
import { TradeUI } from '../prefabs/ui/TradeUI'

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
    tradeUI: TradeUI

    keyboardInput: {
        up?: boolean
        down?: boolean
        left?: boolean
        right?: boolean
    }
    joystick: Joystick
    joystick2: Joystick

    alertBox: AlertBoxUI
    inventoryButton: Phaser.GameObjects.Image
    chat: Chat
    questUI: QuestUI
    redEffect: Phaser.GameObjects.Rectangle
    outfitUI: OutfitUI
    instructionText: Phaser.GameObjects.Text
    chatTexts: Phaser.GameObjects.Text
    chatNames: Phaser.GameObjects.Text
    chatbox: Phaser.GameObjects.Rectangle

    constructor(){
        super('GameUI')
    }

    create(){
        this.gameScene = this.scene.get('Game') as Game

        this.socket = this.registry.get('socket')
        console.log(this.socket)

        this.input.addPointer(2)

        this.add.rectangle(50, 20, 500, 192, 0x223344, 0.5).setOrigin(0)
        this.instructionText = this.add.text(80, 40, 'No instructions yet', {
            fontFamily: 'PixelFont', fontSize: 24,
            color: '#fff'
        }).setOrigin(0).setWordWrapWidth(440)

        this.chatbox = this.add.rectangle(this.scale.width/2, 100, 700, 300, 0x442233, 0.5).setOrigin(0.5, 0)
        this.chatbox.setVisible(false)

        this.chatbox.setInteractive()
        this.chatbox.on('wheel', (pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
            pointer.event.preventDefault()

            this.chatTexts.y -= deltaY*0.1
            this.chatNames.y -= deltaY*0.1
            if(this.chatTexts.y > 120){
                this.chatTexts.y = 120
                this.chatNames.y = 120-2
            }
            else if(this.chatTexts.y < -this.chatTexts.height+400){
                this.chatTexts.y = this.chatTexts.height > 300 ? -this.chatTexts.height+400 : 120
                this.chatNames.y = this.chatTexts.y-2
            }
        })
        this.chatbox.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if(!pointer.isDown) return
            pointer.event.preventDefault()

            this.chatTexts.y += pointer.y - pointer.prevPosition.y
            this.chatNames.y += pointer.y - pointer.prevPosition.y
            if(this.chatTexts.y > 120){
                this.chatTexts.y = 120
                this.chatNames.y = 120-2
            }
            else if(this.chatTexts.y < -this.chatTexts.height+400){
                this.chatTexts.y = this.chatTexts.height > 300 ? -this.chatTexts.height+400 : 120
                this.chatNames.y = this.chatTexts.y-2
            }
        })

        this.chatTexts = this.add.text(this.scale.width/2-300, 120, '', {
            fontFamily: 'PixelFont', fontSize: 24, lineSpacing: 2,
            color: '#fff'
        }).setOrigin(0).setWordWrapWidth(440, true).setMask(this.chatbox.createGeometryMask())
        this.chatNames = this.add.text(this.scale.width/2-300-2, 120-2, '', {
            fontFamily: 'PixelFont', fontSize: 24, fontStyle: 'bold',
            color: '#fff', stroke: '#469', strokeThickness: 2, letterSpacing: -0.5
        }).setOrigin(0).setWordWrapWidth(440, true).setMask(this.chatbox.createGeometryMask())

        this.debugText = this.add.text(this.scale.width - 50, 200, 'Ping: 0ms\nFPS: 0', {
            fontFamily: 'PixelFont', fontSize: 24, fontStyle: 'bold', align: 'right',
            color: '#fff', stroke: '#000', strokeThickness: 1
        }).setOrigin(1)

        setInterval(() => {
            const then = Date.now()
            this.socket.emit('ping', () => {
                const fps = Math.floor(this.game.loop.actualFps*100)/100
                const now = Date.now()
                this.debugText.setText('Ping: '+ (now-then)+'ms\nFPS: '+fps)
            })
        }, 1000)

        this.alertBox = new AlertBoxUI(this, this.scale.width/2, this.scale.height/2)
        this.alertBox.setDepth(100)
        this.alertBox.setVisible(false)

        this.chat = new Chat(this, this.socket)
        this.chat.setVisible(false)

        const bottomBox = this.add.rectangle(this.scale.width/2, this.scale.height, this.scale.width, 80, 0x111111, 0.5)
        bottomBox.setOrigin(0.5, 1)

        this.inventoryButton = this.add.image(this.scale.width/2, this.scale.height - 80, 'inventory-icon')
        this.inventoryButton.setScale(4).setInteractive()
        this.inventoryButton.on('pointerdown', () => {
            this.inventoryUI.setVisible(true)
        })

        const debugToggle = this.add.image(this.scale.width - 100, 50, 'ui-debug').setScale(4)
        debugToggle.setInteractive()
        debugToggle.on('pointerup', () => {
            this.gameScene.isDebug = !this.gameScene.isDebug
            this.gameScene.debugGraphics.clear()
        })

        const fullscreenToggle = this.add.image(this.scale.width - 200, 50, 'ui-fullscreen').setScale(4)
        fullscreenToggle.setInteractive()
        fullscreenToggle.on('pointerdown', () => {
            if (this.scale.isFullscreen){
                this.scale.stopFullscreen();
            }
            else{
                this.scale.startFullscreen();
            }
        })

        const changeOutfitToggle = this.add.image(this.scale.width - 300, 50, 'ui-change-outfit').setScale(4)
        changeOutfitToggle.setInteractive()
        changeOutfitToggle.on('pointerdown', () => {
            if (!this.outfitUI.visible){
                this.outfitUI.setVisible(true)
            }
            else{
                this.outfitUI.setVisible(false)
            }
        })

        const chatToggle = this.add.image(this.scale.width - 400, 50, 'ui-chat').setScale(4)
        chatToggle.setInteractive()
        chatToggle.on('pointerdown', () => {
            if (!this.chat.visible){
                this.chat.setVisible(true)
            }
            else{
                this.chat.setVisible(false)
            }
        })

        this.redEffect = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xff0000)
        this.redEffect.setAlpha(0)
        this.redEffect.setOrigin(0, 0)
        this.redEffect.setDepth(1000)

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
                x: this.scale.width - 360,
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

        this.handleGameEvent()
    }

    update(){
        this.keyboardInput = {
            up: this.input.keyboard?.addKey('W', false)?.isDown,
            down: this.input.keyboard?.addKey('S', false)?.isDown,
            left: this.input.keyboard?.addKey('A', false)?.isDown,
            right: this.input.keyboard?.addKey('D', false)?.isDown
        }

        if((this.questUI && this.questUI.visible) ||
            (this.outfitUI && this.outfitUI.visible) ||
            (this.alertBox && this.alertBox.visible)){
            this.keyboardInput = { up: false, down: false, left: false, right: false }
        }

        if(this.hotbarUI && this.hotbarUI.active && this.hotbarUI instanceof HotbarUI){
            this.hotbarUI.update()
        }

        if(this.statsUI && this.statsUI.active && this.statsUI instanceof StatsUI && this.gameScene.player){
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
                this.gameScene.camera.setFollowOffset(-x*50, -y*50)
            }
        }
    }

    handleGameEvent(){
        this.gameScene.events.on('start', () => {
            this.scene.setVisible(true)
            this.chat = new Chat(this, this.socket)
            this.chat.setVisible(false)
        })
        this.gameScene.events.on('shutdown', () => {
            console.log('shutdown')
            this.scene.setVisible(false)
            this.hotbarUI.destroy()
            this.statsUI.destroy()
            this.inventoryUI.destroy()
            this.chat.destroy()
            this.questUI.destroy()
            this.outfitUI.destroy()
        })
    }

    setupUI(player: Player, ownedOutfits: string[]){
        if(this.statsUI?.active) this.statsUI.destroy()
        if(this.hotbarUI?.active) this.hotbarUI.destroy()
        if(this.inventoryUI?.active) this.inventoryUI.destroy()

        this.statsUI = new StatsUI(this)

        this.hotbarUI = new HotbarUI(this, player.inventory)

        this.inventoryUI = new InventoryUI(this, player.inventory)
        this.inventoryUI.setVisible(false)

        this.inventoryUI.background.on('pointerdown', () => {
            this.inventoryUI.setVisible(false)
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

        player.inventory.onDropItem = (index, dir, quantity) => {
            this.socket.emit('dropItem', index, dir, quantity)
        }
        
        this.questUI = new QuestUI(this)

        this.questUI.onOpen = (pos) => {
            const player = this.gameScene.player
            this.gameScene.camera.setFollowOffset(player.x - pos.x, player.y - pos.y - 40)
            this.tweens.add({
                targets: this.gameScene.camera,
                zoom: 1.6,
                duration: 400,
                ease: 'Linear'
            })
        }

        this.questUI.onClose = () => {
            this.gameScene.camera.setFollowOffset(0, 0)
            this.tweens.add({
                targets: this.gameScene.camera,
                zoom: 1,
                duration: 400,
                ease: 'Linear'
            })
        }

        this.outfitUI = new OutfitUI(this, player, ownedOutfits)
        this.outfitUI.setVisible(false)

        this.outfitUI.onOpen = (pos) => {
            const player = this.gameScene.player
            this.gameScene.camera.setFollowOffset(player.x - pos.x, player.y - pos.y - 40)
            this.tweens.add({
                targets: this.gameScene.camera,
                zoom: 1.6,
                duration: 400,
                ease: 'Linear'
            })
        }

        this.outfitUI.onClose = () => {
            this.gameScene.camera.setFollowOffset(0, 0)
            this.tweens.add({
                targets: this.gameScene.camera,
                zoom: 1,
                duration: 400,
                ease: 'Linear'
            })
        }


        this.tradeUI = new TradeUI(this, this.scale.width/2, this.scale.height-272, player.inventory)
        this.tradeUI.setVisible(false)
    }
}