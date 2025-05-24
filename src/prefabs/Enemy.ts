import { Game } from '../scenes/Game'
import p from 'planck'
import { BaseItem } from './BaseItem'
import { ItemInstance } from './ItemInstance'
import { Player } from './Player'

export class Enemy extends Phaser.GameObjects.Container{

    id: string
    maxHealth: number
    health: number
    speed = 1

    scene: Game
    itemInstance: BaseItem
    sprite: Phaser.GameObjects.Sprite
    healthBar: Phaser.GameObjects.Rectangle

    pBody: p.Body
    attackDir: p.Vec2

    defaultPos: p.Vec2
    triggerArea: p.Body
    visionArea: p.Body
    target: Player | null

    constructor(scene: Game, x: number, y: number, id: string){
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

        this.defaultPos = this.pBody.getPosition().clone()

        this.maxHealth = 100
        this.health = this.maxHealth

        const bar = scene.add.rectangle(0, -120, 162, 14, 0x696669)
        this.healthBar = scene.add.rectangle(0, -120, 162, 14, 0xff5544)

        this.attackDir = new p.Vec2(0, 0)
        this.itemInstance = new ItemInstance(scene, this.pBody, 'sword').itemInstance

        this.sprite = scene.add.sprite(0, -16, 'char').setScale(scene.gameScale)
        this.sprite.setTint(0xff9999)

        this.triggerArea = this.createArea(2)
        this.visionArea = this.createArea(6)

        this.add([this.itemInstance, this.sprite, bar, this.healthBar])
    }

    update(){
        const vel = this.pBody.getLinearVelocity()

        if(vel.x != 0 || vel.y != 0){
            if(vel.y > -0.1) this.sprite.play('run-down', true)
            else this.sprite.play('run-up', true)
        
            if(vel.x > 0) this.sprite.flipX = false
            else if(vel.x < 0) this.sprite.flipX = true
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
        
        this.healthBar.setSize(160*this.health/this.maxHealth, 12)
        this.healthBar.setX(-80-80*this.health/-this.maxHealth)
    }

    createArea(radius: number){
        const pBody = this.scene.world.createKinematicBody()
        pBody.createFixture({
            shape: new p.Circle(new p.Vec2(0, 0), radius),
            isSensor: true
        })
        pBody.setUserData(this)
        pBody.setPosition(this.pBody.getPosition())
        return pBody
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