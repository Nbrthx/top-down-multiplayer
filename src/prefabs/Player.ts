import { Game } from '../scenes/Game'
import p from 'planck'
import { BaseItem } from './BaseItem'
import { ItemInstance } from './ItemInstance'
import { Inventory } from './Inventory'
import { SpatialSound } from '../components/SpatialAudio'
import { TextBox } from './TextBox'

export class Player extends Phaser.GameObjects.Container{

    id: string
    maxHealth: number
    health: number
    speed = 1.4

    scene: Game
    itemInstance: BaseItem
    sprite: Phaser.GameObjects.Sprite
    healthBar: Phaser.GameObjects.Rectangle
    inventory: Inventory
    nameText: Phaser.GameObjects.Text

    audio?: { step: SpatialSound, hit: SpatialSound }

    pBody: p.Body
    attackDir: p.Vec2
    textbox: TextBox

    constructor(scene: Game, x: number, y: number, id: string, username: string){
        super(scene, x, y)

        this.scene = scene
        this.id = id

        scene.add.existing(this)

        this.pBody = scene.world.createDynamicBody({
            position: new p.Vec2(x/scene.gameScale/32, y/scene.gameScale/32),
            fixedRotation: true
        })
        this.pBody.createFixture({
            shape: new p.Box(0.2, 0.4, new p.Vec2(0, 0.3)),
            filterCategoryBits: 2,
            filterMaskBits: 1,
        })
        this.pBody.setUserData(this)

        this.inventory = new Inventory(this)

        this.textbox = new TextBox(this.scene, 0, -190)

        this.maxHealth = 100
        this.health = this.maxHealth

        const bar = scene.add.rectangle(0, -120, 162, 14, 0x696669)
        this.healthBar = scene.add.rectangle(0, -120, 162, 14, 0x44ff55)

        this.attackDir = new p.Vec2(0, 0)
        this.itemInstance = new ItemInstance(scene, this.pBody, 'punch').itemInstance

        this.sprite = scene.add.sprite(0, 0, 'char').setScale(scene.gameScale)

        this.nameText = scene.add.text(0, -36*scene.gameScale, username, {
            fontFamily: 'PixelFont', fontSize: 28, letterSpacing: 2,
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setResolution(5)

        this.add([this.itemInstance, this.sprite, bar, this.healthBar, this.nameText, this.textbox])
    }

    update(){
        const vel = this.pBody.getLinearVelocity()

        if(!this.audio && this.scene.player){
            this.audio = {
                step: this.scene.spatialAudio.addSound('audio-step'),
                hit: this.scene.spatialAudio.addSound('audio-hit')
            }
            this.audio.step.sound?.setRate(1.2)
        }

        if(vel.x != 0 || vel.y != 0){
            if(vel.y > -0.1) this.sprite.play('run-down', true)
            else this.sprite.play('run-up', true)
        
            if(vel.x > 0) this.sprite.flipX = false
            else if(vel.x < 0) this.sprite.flipX = true

            const { x, y } = this.pBody.getPosition()
            this.audio?.step.playSound(x, y)
        }
        else this.sprite.play('idle', true)

        if(this.attackDir.length() > 0){
            if(this.itemInstance) this.itemInstance.use(this.attackDir.x, this.attackDir.y)
            this.attackDir = new p.Vec2(0, 0)
        }

        this.setDepth(this.y/this.scene.gameScale)

        this.x = this.pBody.getPosition().x*this.scene.gameScale*32
        this.y = this.pBody.getPosition().y*this.scene.gameScale*32
        
        this.healthBar.setSize(160*this.health/this.maxHealth, 12)
        this.healthBar.setX(-80-80*this.health/-this.maxHealth)
    }

    equipItem(item: string){
        this.pBody.getWorld().queueUpdate(() => {
            if(this.itemInstance) this.itemInstance.destroy()

            const newItemInstance = new ItemInstance(this.scene, this.pBody, item).itemInstance
            newItemInstance.timestamp = Date.now()+1000

            this.itemInstance = newItemInstance
            this.addAt(this.itemInstance, 0)
        })
    }

    hitEffect(){
        this.scene.tweens.add({
            targets: this.sprite,
            duration: 50,
            repeat: 2,
            yoyo: true,
            ease: 'Cubic.easeOut',
            alpha: 0.4
        }).once('complete', () => {
            this.sprite.setAlpha(1)
        })
        const { x, y } = this.pBody.getPosition()
        this.audio?.hit.playSound(x, y, true, false)
    }

    destroy() {
        this.scene.contactEvents.destroyEventByBody(this.pBody)
        this.scene.world.destroyBody(this.pBody)
        if(this.itemInstance) this.itemInstance.destroy()
        super.destroy()
    }
}