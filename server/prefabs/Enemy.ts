import { Game } from '../GameWorld'
import * as p from 'planck'
import { BaseItem } from './BaseItem'
import { ItemInstance } from './ItemInstance'
import { Player } from './Player'
import { MeleeWeapon } from './items/MeleeWeapon'

export class Enemy{

    id: string
    uid: string
    maxHealth: number
    health: number
    speed = 3

    scene: Game
    itemInstance: BaseItem

    pBody: p.Body
    attackDir: p.Vec2

    defaultPos: p.Vec2
    triggerArea: p.Body
    visionArea: p.Body
    target: Player | null
    attacker: Player[]
    
    force: number
    forceDir: p.Vec2
    knockback: number
    knockbackDir: p.Vec2

    constructor(scene: Game, x: number, y: number, id: string){
        this.scene = scene
        this.id = id
        this.uid = crypto.randomUUID()

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

        this.defaultPos = this.pBody.getPosition().clone()

        this.maxHealth = 100
        this.health = this.maxHealth

        this.attackDir = new p.Vec2(0, 0)
        this.itemInstance = new ItemInstance(scene, this.pBody, 'sword').itemInstance
        if(this.itemInstance instanceof MeleeWeapon){
            this.scene.addHitbox(this.itemInstance.hitbox, this.scene.entityBodys)
        }

        this.attacker = []

        this.triggerArea = this.createArea(2)
        this.visionArea = this.createArea(7)

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
                dir.mul(this.speed)
                this.pBody.setLinearVelocity(dir)
            }
            else this.pBody.setLinearVelocity(new p.Vec2(0, 0))
        }
        else{
            const dir = this.defaultPos.clone().sub(this.pBody.getPosition())
            
            if(dir.length() > 0.1){
                dir.normalize()
                dir.mul(this.speed)
                this.pBody.setLinearVelocity(dir)
            }
            else this.pBody.setLinearVelocity(new p.Vec2(0, 0))
        }

        if(this.attackDir.length() > 0){
            if(this.itemInstance) this.itemInstance.use(this.attackDir.x, this.attackDir.y)

            this.attackDir = new p.Vec2(0, 0)
        }

        if(!this.itemInstance.canMove){
            if(this.itemInstance.isAttacking) this.pBody.setLinearVelocity(new p.Vec2(0, 0))
        }
        
        if(this.knockback > 1 || this.knockback < -1){
            const dir = this.knockbackDir.clone()
            dir.normalize()
            dir.mul(this.knockback)
            this.pBody.applyLinearImpulse(dir, this.pBody.getWorldCenter())
            if(this.knockback > 0) this.knockback -= 2
            else this.knockback += 2
        }
        else if(this.force > 1 || this.force < -1){
            const dir = this.forceDir.clone()
            dir.normalize()
            dir.mul(this.force)
            this.pBody.applyLinearImpulse(dir, this.pBody.getWorldCenter())
            if(this.force > 0) this.force -= 2
            else this.force += 2
        }

        this.triggerArea.setPosition(this.pBody.getPosition())
        this.visionArea.setPosition(this.defaultPos)

        this.healWhenNoTarget()
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
            if(!(bodyA.getUserData() instanceof Player)) return

            this.target = bodyA.getUserData() as Player
            this.scene.world.queueUpdate(() => this.visionArea.setActive(false))

            setTimeout(() => {
                this.target = null
                this.visionArea.setActive(true)
            }, 1000)
        })
    }

    healWhenNoTarget(){
        if(!this.target){
            this.health += 0.1
            if(this.health > this.maxHealth) this.health = this.maxHealth
        }
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