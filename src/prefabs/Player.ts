import { Game } from '../scenes/Game'
import p from 'planck'
import { BaseItem } from './BaseItem'
import { ItemInstance, itemList } from './ItemInstance'
import { Inventory } from './Inventory'
import { SpatialSound } from '../components/SpatialAudio'
import { TextBox } from './TextBox'
import { Stats } from '../components/Stats'

export class Player extends Phaser.GameObjects.Container{

    id: string
    maxHealth: number
    health: number
    speed = 4.2

    scene: Game
    itemInstance: BaseItem
    sprite: Phaser.GameObjects.Sprite
    emptyBar: Phaser.GameObjects.Rectangle
    healthBar: Phaser.GameObjects.Rectangle
    nameText: Phaser.GameObjects.Text
    
    username: string
    inventory: Inventory
    stats: Stats

    audio?: { step: SpatialSound, hit: SpatialSound }

    pBody: p.Body
    attackDir: p.Vec2
    textbox: TextBox
    aimAssist: Phaser.GameObjects.Rectangle

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
            shape: new p.Box(0.24, 0.3, new p.Vec2(0, 0.2)),
            filterCategoryBits: 2,
            filterMaskBits: 1,
        })
        this.pBody.setUserData(this)

        this.username = username
        this.inventory = new Inventory(this)
        this.stats = new Stats()

        this.textbox = new TextBox(this.scene, 0, -190)

        this.maxHealth = 100
        this.health = this.maxHealth

        this.emptyBar = scene.add.rectangle(0, -120, 162, 14, 0x494449).setRounded(4)
        this.healthBar = scene.add.rectangle(0, -120, 162, 14, 0x33ff77).setRounded(4)

        this.attackDir = new p.Vec2(0, 0)
        this.itemInstance = new ItemInstance(scene, this.pBody, 'punch').itemInstance

        this.sprite = scene.add.sprite(0, -36, 'char').setScale(scene.gameScale)

        this.aimAssist = scene.add.rectangle(0,12, 96, 16, 0xffffff, 0.5).setOrigin(-1.5, 0.5).setVisible(false)
        
        const shadow = scene.add.image(0, 19*scene.gameScale, 'shadow').setAlpha(0.4).setScale(scene.gameScale)

        this.nameText = scene.add.text(0, -36*scene.gameScale, username+' Lv.'+this.stats.getLevel(), {
            fontFamily: 'PixelFont', fontSize: 24, letterSpacing: 2,
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setResolution(4)

        this.add([shadow, this.aimAssist, this.itemInstance, this.sprite, this.emptyBar, this.healthBar, this.nameText, this.textbox])
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

        if(this.nameText.text.split('.')[1] != this.stats.getLevel()+''){
            this.nameText.setText(this.username+' Lv.'+this.stats.getLevel())
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

            for(let i = 0; i < 5; i++){
                const item = this.inventory.items[i]
                const instanceData = itemList.find(v => v.id === item.id) || itemList[0]
                const cooldown = instanceData.config.cooldown
                if(i == this.inventory.activeIndex) item.timestamp = Date.now()
                else if(Date.now()-item.timestamp > cooldown) item.timestamp = Date.now()-cooldown+500
            }

            this.attackDir = new p.Vec2(0, 0)
        }

        this.setDepth(this.y/this.scene.gameScale)

        const isReady = this.itemInstance.timestamp+this.itemInstance.config.cooldown < Date.now()
        if(this.aimAssist.visible && isReady) this.aimAssist.setFillStyle(0xffffff, 0.5)
        else if(this.aimAssist.visible) this.aimAssist.setFillStyle(0xcc3333, 0.4)

        this.x = this.pBody.getPosition().x*this.scene.gameScale*32
        this.y = this.pBody.getPosition().y*this.scene.gameScale*32
        
        if(this.healthBar.visible){
            this.healthBar.setSize(160*this.health/this.maxHealth, 12)
            this.healthBar.setX(-80-80*this.health/-this.maxHealth)
        }
    }

    equipItem(index: number){
        this.pBody.getWorld().queueUpdate(() => {
            const item = this.inventory.items[index]

            if(this.itemInstance){
                const timestamp = item.timestamp
                this.inventory.setItemTimestamp(this.inventory.activeIndex, timestamp)
                this.itemInstance.destroy()
            }

            const newItemInstance = new ItemInstance(this.scene, this.pBody, item.id).itemInstance
            newItemInstance.timestamp = item.timestamp

            this.itemInstance = newItemInstance
            this.addAt(this.itemInstance, 0)
        })
    }

    hitEffect(){
        let itr = 0
        const splash = () => {
            if(itr >= 4) return

            if(this.sprite.isTinted) this.sprite.clearTint()
            else this.sprite.setTintFill(0xffffff)
            itr++

            setTimeout(() => splash(), 50)
        }
        splash()
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