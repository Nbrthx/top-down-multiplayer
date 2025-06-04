import { Game } from '../GameWorld'
import * as p from 'planck'
import { Account } from '../server'
import { Inventory } from './Inventory'
import { BaseItem } from './BaseItem'
import { ItemInstance } from './ItemInstance'
import { MeleeWeapon } from './items/MeleeWeapon'

export class Player{

    account: Account

    id: string
    health: number
    maxHealth: number
    speed = 4.2

    scene: Game
    pBody: p.Body
    itemInstance: BaseItem
    
    attackDir: p.Vec2
    knockback: number
    knockbackDir: p.Vec2
    inventory: Inventory

    constructor(scene: Game, x: number, y: number, id: string, account: Account){
        this.scene = scene
        this.id = id
        this.account = account

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

        this.maxHealth = 100
        this.health = this.maxHealth

        this.itemInstance = new ItemInstance(scene, this.pBody, 'punch').itemInstance
        this.attackDir = new p.Vec2(0, 0)

        this.knockback = 0
        this.knockbackDir = new p.Vec2(0, 0)
    }

    update(){
        if(this.attackDir.length() > 0){
            this.itemInstance.use(this.attackDir.x, this.attackDir.y)
            this.attackDir = new p.Vec2(0, 0)
        }

        this.account.health = this.health

        if(this.knockback > 0){
            this.pBody.applyLinearImpulse(new p.Vec2(this.knockbackDir.x*this.knockback, this.knockbackDir.y*this.knockback), this.pBody.getWorldCenter())
            this.knockback -= 2
        }

    }

    equipItem(index: number){
        this.scene.world.queueUpdate(() => {
            const item = this.inventory.items[index]

            if(this.itemInstance){
                const timestamp = this.itemInstance.timestamp
                this.inventory.setItemTimestamp(this.inventory.activeIndex, timestamp)
                this.itemInstance.destroy()
            }

            const newItemInstance = new ItemInstance(this.scene, this.pBody, item.id).itemInstance
            newItemInstance.timestamp = item.timestamp
            if(newItemInstance instanceof MeleeWeapon){
                this.scene.addHitbox(newItemInstance.hitbox, this.scene.entityBodys)
            }

            this.itemInstance = newItemInstance
        })
    }

    destroy(){
        this.scene.world.destroyBody(this.pBody)
        this.scene.contactEvents.destroyEventByBody(this.pBody)
        this.itemInstance.destroy()
    }
}