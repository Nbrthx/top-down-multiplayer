import { Game } from '../GameWorld'
import p from 'planck'
import { BaseItem } from './BaseItem'
import { ItemInstance } from './ItemInstance'
import { Player } from './Player'

export class Enemy{

    id: string
    maxHealth: number
    health: number
    speed = 1

    scene: Game
    itemInstance: BaseItem

    pBody: p.Body
    attackDir: p.Vec2

    defaultPos: p.Vec2
    triggerArea: p.Body
    visionArea: p.Body
    target: Player | null
    
    knockback: number
    knockbackDir: p.Vec2

    constructor(scene: Game, x: number, y: number, id: string){
        this.scene = scene
        this.id = id

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

        this.attackDir = new p.Vec2(0, 0)
        this.itemInstance = new ItemInstance(scene, this.pBody, 'sword').itemInstance

        this.triggerArea = this.createArea(2)
        this.visionArea = this.createArea(6)

        this.triggerEvent()
        this.visionEvent()
        
        this.knockback = 0
        this.knockbackDir = new p.Vec2(0, 0)
    }

    update(){
        if(this.target && this.target instanceof Player){
            const dir = this.target.pBody.getPosition().clone().sub(this.pBody.getPosition())
            
            if(dir.length() > 1.4){
                dir.normalize()
                this.pBody.setLinearVelocity(dir)
            }
            else this.pBody.setLinearVelocity(new p.Vec2(0, 0))
        }
        else{
            const dir = this.defaultPos.clone().sub(this.pBody.getPosition())
            
            if(dir.length() > 0.1){
                dir.normalize()
                this.pBody.setLinearVelocity(dir)
            }
            else this.pBody.setLinearVelocity(new p.Vec2(0, 0))
        }

        if(this.attackDir.length() > 0){
            if(this.itemInstance) this.itemInstance.use(this.attackDir.x, this.attackDir.y)
            this.attackDir = new p.Vec2(0, 0)
        }
        
        if(this.knockback > 0){
            this.pBody.applyLinearImpulse(new p.Vec2(this.knockbackDir.x*this.knockback, this.knockbackDir.y*this.knockback), this.pBody.getWorldCenter())
            this.knockback -= 0.5
        }

        this.triggerArea.setPosition(this.pBody.getPosition())
        this.visionArea.setPosition(this.defaultPos)
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

    triggerEvent(){
        this.scene.contactEvents.addEvent(this.scene.entityBodys, this.triggerArea, (bodyA) => {
            if(bodyA == this.pBody) return

            const dir = bodyA.getPosition().clone().sub(this.pBody.getPosition())
            dir.normalize()

            setTimeout(() => {
                this.attackDir = dir
                this.triggerArea.setActive(false)

                setTimeout(() => {
                    this.triggerArea.setActive(true)
                }, 1000)
            }, 300)
        })
    }

    visionEvent(){
        this.scene.contactEvents.addEvent(this.scene.entityBodys, this.visionArea, (bodyA) => {
            if(bodyA == this.pBody) return

            this.target = bodyA.getUserData() as Player
            this.scene.world.queueUpdate(() => this.visionArea.setActive(false))

            setTimeout(() => {
                this.target = null
                this.visionArea.setActive(true)
            }, 1000)
        })
    }

    destroy() {
        this.scene.world.destroyBody(this.pBody)
        this.scene.world.destroyBody(this.triggerArea)
        this.scene.world.destroyBody(this.visionArea)
        this.scene.contactEvents.destroyEventByBody(this.pBody)
        this.scene.contactEvents.destroyEventByBody(this.triggerArea)
        this.scene.contactEvents.destroyEventByBody(this.visionArea)
        if(this.itemInstance) this.itemInstance.destroy()
    }
}