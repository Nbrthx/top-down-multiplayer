import { Game } from '../GameWorld'
import * as p from 'planck'
import { BaseItem } from './BaseItem'
import { ItemInstance } from './ItemInstance'
import { Player } from './Player'
import { MeleeWeapon } from './items/MeleeWeapon'
import { _enemyList } from '../json/enemy-list.json'

interface EnemyConfig {
    id: string
    maxHealth: number
    speed: number
    visionDistance: number
    attackDistance: number
    zigzagDistance: number
    stopDistance: number
    attackSpeed: number
    attackDelay: number
    weapon: string
    xpReward: number
    itemReward?: [string, number]
}

const enemyList = _enemyList as EnemyConfig[]

export class Enemy{

    id: string
    uid: string
    maxHealth: number
    health: number
    speed = 3

    config: EnemyConfig

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

        this.config = enemyList.find(e => e.id === id) || enemyList[0]
        this.speed = this.config.speed

        this.maxHealth = this.config.maxHealth
        this.health = this.maxHealth

        this.attackDir = new p.Vec2(0, 0)
        this.itemInstance = new ItemInstance(scene, this.pBody, this.config.weapon).itemInstance
        if(this.itemInstance instanceof MeleeWeapon){
            this.scene.addHitbox(this.itemInstance.hitbox, this.scene.entityBodys)
        }

        this.attacker = []

        this.triggerArea = this.createArea(this.config.attackDistance)
        this.visionArea = this.createArea(this.config.visionDistance)

        this.triggerEvent()
        this.visionEvent()
        
        this.knockback = 0
        this.knockbackDir = new p.Vec2(0, 0)
    }

    update(){
        if(this.target && this.target instanceof Player){
            const dir = this.target.pBody.getPosition().clone().sub(this.pBody.getPosition())
            
            if(dir.length() > this.config.zigzagDistance){
                dir.normalize()
                dir.mul(this.speed)
                this.pBody.setLinearVelocity(dir)
            }
            else if(dir.length() > this.config.stopDistance){
                let rad = Math.atan2(dir.y, dir.x)
                rad += (Math.floor(Date.now()/500)%3 - 1)*0.7
                dir.x = Math.cos(rad)
                dir.y = Math.sin(rad)

                dir.normalize()
                dir.mul(this.speed)
                this.pBody.setLinearVelocity(dir)
            }
            else if(dir.length() < this.config.stopDistance-1){
                dir.normalize()
                dir.mul(-this.speed)
                this.pBody.setLinearVelocity(dir)
            }
            else this.pBody.setLinearVelocity(new p.Vec2(0, 0))

            if(this.pBody.getLinearVelocity().length() > 0.1){
                let wallDir = new p.Vec2(0, 0)
                let minDist = 2
                for(let collision of this.scene.mapSetup.collision){
                    const bodySize = collision.getUserData() as { width: number, height: number } | undefined
                    const corners = [[0, 0], [0, bodySize?.height || 0], [bodySize?.width || 0, 0], [bodySize?.width || 0, bodySize?.height || 0]]
                    for(let corner of corners){
                        const cornerPos = collision.getPosition().clone().add(new p.Vec2(corner[0]/32, corner[1]/32))
                        if(this.pBody.getPosition().clone().sub(cornerPos).length() < minDist){
                            minDist = this.pBody.getPosition().clone().sub(cornerPos).length()
                            wallDir = this.pBody.getPosition().clone().sub(cornerPos)
                        }
                    }
                }
                wallDir.normalize()
                wallDir.mul(this.speed)
                const vel = this.pBody.getLinearVelocity().clone().add(wallDir)
                this.pBody.setLinearVelocity(vel)
            }
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
            if(this.itemInstance){
                this.refreshWeapon()
                this.itemInstance.use(this.attackDir.x, this.attackDir.y)
            }

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
            if(!(bodyA.getUserData() instanceof Player) || bodyA.getUserData() instanceof Enemy) return

            const dir = bodyA.getPosition().clone().sub(this.pBody.getPosition())
            dir.normalize()

            setTimeout(() => {
                this.attackDir = dir
                this.triggerArea.setActive(false)

                setTimeout(() => {
                    this.triggerArea.setActive(true)
                }, this.config.attackSpeed)
            }, this.config.attackDelay)
        })
    }

    visionEvent(){
        this.scene.contactEvents.addEvent(this.scene.entityBodys, this.visionArea, (bodyA) => {
            if(bodyA == this.pBody) return
            if(!(bodyA.getUserData() instanceof Player) || bodyA.getUserData() instanceof Enemy) return

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
            this.health += 0.03
            if(this.health > this.maxHealth) this.health = this.maxHealth
        }
    }

    refreshWeapon(){
        if(this.itemInstance){
            this.itemInstance.destroy()
            this.itemInstance = new ItemInstance(this.scene, this.pBody, this.config.weapon).itemInstance
            if(this.itemInstance instanceof MeleeWeapon){
                this.scene.addHitbox(this.itemInstance.hitbox, this.scene.entityBodys)
            }
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