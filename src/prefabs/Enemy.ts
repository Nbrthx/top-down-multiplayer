import { Game } from '../scenes/Game'
import p from 'planck'
import { BaseItem } from './BaseItem'
import { ItemInstance } from './ItemInstance'
import { Player } from './Player'
import { SpatialSound } from '../components/SpatialAudio'
import { Outfit } from './Outfit'

interface EnemyConfig {
    id: string
    name: string
    maxHealth: number
    visionDistance: number
    attackDistance: number
    weapon: string
    outfit: [boolean, number, string, string, string, string]
}

export const enemyList: EnemyConfig[] = [
    {
        id: 'enemy1',
        name: 'Swordman',
        maxHealth: 60,
        visionDistance: 6,
        attackDistance: 2,
        weapon: 'sword',
        outfit: [true, 0xffaaaa, 'basic', 'basic', 'basic', 'basic']
    },
    {
        id: 'enemy2',
        name: 'Archer',
        maxHealth: 80,
        visionDistance: 6,
        attackDistance: 6,
        weapon: 'bow',
        outfit: [false, 0xffaaaa, 'basic', 'basic', 'basic', 'basic']
    },
    {
        id: 'enemy3',
        name: 'Ninja',
        maxHealth: 100,
        visionDistance: 7,
        attackDistance: 7,
        weapon: 'blue-knife',
        outfit: [false, 0xffaaff, 'bodied', 'basic', 'grey', 'basic']
    },
    {
        id: 'enemy4',
        name: 'Assassin',
        maxHealth: 120,
        visionDistance: 7,
        attackDistance: 2.5,
        weapon: 'sword',
        outfit: [true, 0x99ccff, 'spread', 'basic', 'black', 'basic']
    }
]

export class Enemy extends Phaser.GameObjects.Container{

    id: string
    uid: string
    maxHealth: number
    health: number

    config: EnemyConfig

    scene: Game
    itemInstance: BaseItem
    sprite: Outfit
    emptyBar: Phaser.GameObjects.Rectangle
    damageBar: Phaser.GameObjects.Rectangle
    healthBar: Phaser.GameObjects.Rectangle

    pBody: p.Body
    attackDir: p.Vec2

    defaultPos: p.Vec2
    triggerArea: p.Body
    visionArea: p.Body
    target: Player | null
    audio?: { step: SpatialSound; hit: SpatialSound }
    nameText: Phaser.GameObjects.Text

    constructor(scene: Game, x: number, y: number, id: string, uid: string){
        super(scene, x, y)

        this.scene = scene
        this.id = id
        this.uid = uid

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

        this.config = enemyList.find(e => e.id === id) || enemyList[0]

        this.defaultPos = this.pBody.getPosition().clone()

        this.maxHealth = this.config.maxHealth
        this.health = this.maxHealth

        this.emptyBar = scene.add.rectangle(0, -130, 166, 18, 0x494449).setRounded(4)
        this.damageBar = scene.add.rectangle(0, -130, 164, 16, 0xffccaa).setRounded(4)
        this.healthBar = scene.add.rectangle(0, -130, 164, 16, 0xbb4433).setRounded(4)

        this.attackDir = new p.Vec2(0, 0)
        this.itemInstance = new ItemInstance(scene, this.pBody, this.config.weapon).itemInstance

        this.sprite = new Outfit(scene)

        const [isMale, color, hair, face, body, leg] = this.config.outfit
        this.sprite.setOutfit(isMale, color, hair, face, body, leg)
        
        const shadow = scene.add.image(0, 19*scene.gameScale, 'shadow').setAlpha(0.4).setScale(scene.gameScale)

        this.nameText = scene.add.text(0, -38*scene.gameScale, this.config.name, {
            fontFamily: 'PixelFont', fontSize: 24, letterSpacing: 2,
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setResolution(4)

        this.triggerArea = this.createArea(this.config.attackDistance, true)
        this.visionArea = this.createArea(this.config.visionDistance)

        this.add([shadow, this.itemInstance, this.sprite, this.emptyBar, this.damageBar, this.healthBar, this.nameText])
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
            if(vel.y > -0.1) this.sprite.play('rundown', true)
            else this.sprite.play('runup', true)
        
            if(vel.x > 0) this.sprite.setFlipX(false)
            else if(vel.x < 0) this.sprite.setFlipX(true)
            
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

        this.triggerArea.setPosition(this.pBody.getPosition())
        
        this.barUpdate(this.healthBar)
    }

    barUpdate(bar: Phaser.GameObjects.Rectangle){
        if(bar.visible){
            bar.setSize(164*this.health/this.maxHealth, 16)
            bar.setX(-82-82*this.health/-this.maxHealth)
        }
    }

    createArea(radius: number, isTrigger = false){
        const pBody = isTrigger ? this.scene.world.createKinematicBody() : this.scene.world.createBody()
        pBody.createFixture({
            shape: new p.Circle(new p.Vec2(0, 0), radius),
            isSensor: true
        })
        pBody.setUserData(this)
        pBody.setPosition(this.pBody.getPosition())
        return pBody
    }

    hitEffect(){
        let itr = 0
        const splash = () => {
            if(itr >= 6){
                if(this.damageBar.active){
                    this.damageBar.setSize(164*this.health/this.maxHealth, 16)
                    this.damageBar.setX(-82-82*this.health/-this.maxHealth)
                }
                return
            }

            if(this.sprite.isTinted()) this.sprite.clearTint()
            else this.sprite.setTintFill(0xffffff)
            itr++

            setTimeout(() => splash(), 50)
        }
        splash()
        const { x, y } = this.pBody.getPosition()
        this.audio?.hit.playSound(x, y, true, false)
    }

    destroy() {
        this.scene.world.destroyBody(this.pBody)
        this.scene.world.destroyBody(this.triggerArea)
        this.scene.world.destroyBody(this.visionArea)
        this.scene.contactEvents.destroyEventByBody(this.pBody)
        this.scene.contactEvents.destroyEventByBody(this.triggerArea)
        this.scene.contactEvents.destroyEventByBody(this.visionArea)
        if(this.itemInstance) this.itemInstance.destroy()
        super.destroy()
    }
}