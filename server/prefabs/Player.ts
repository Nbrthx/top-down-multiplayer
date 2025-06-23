import { Game } from '../GameWorld'
import * as p from 'planck'
import { Account } from '../server'
import { Inventory } from './Inventory'
import { BaseItem } from './BaseItem'
import { ItemInstance } from './ItemInstance'
import { MeleeWeapon } from './items/MeleeWeapon'
import { Quest } from '../components/Quests'

export class Player{

    account: Account

    uid: string
    health: number
    maxHealth: number
    speed = 4.2

    scene: Game
    pBody: p.Body
    itemInstance: BaseItem
    
    attackDir: p.Vec2
    force: number
    forceDir: p.Vec2
    knockback: number
    knockbackDir: p.Vec2

    outfit: {
        isMale: boolean
        color: number
        hair: string
        face: string
        body: string
        leg: string
    }
    inventory: Inventory
    questInProgress: Quest | null = null

    constructor(scene: Game, x: number, y: number, uid: string, account: Account){
        this.scene = scene
        this.uid = uid
        this.account = account

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
        
        this.outfit = account.outfit
        this.inventory = new Inventory(this)

        this.maxHealth = 100
        this.health = account.health || this.maxHealth

        this.itemInstance = new ItemInstance(scene, this.pBody, 'punch').itemInstance
        this.attackDir = new p.Vec2(0, 0)

        this.force = 0
        this.forceDir = new p.Vec2(0, 0)

        this.knockback = 0
        this.knockbackDir = new p.Vec2(0, 0)

        this.inventory.updateInventory(account.inventory)
        account.inventory = this.inventory.items
    }

    update(){
        if(this.attackDir.length() > 0){
            this.itemInstance.use(this.attackDir.x, this.attackDir.y)

            this.inventory.refreshTimestamp()

            this.attackDir = new p.Vec2(0, 0)
        }

        this.account.health = this.health

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
    }

    equipItem(index: number){
        this.scene.world.queueUpdate(() => {
            let item = this.inventory.items[index]

            if(this.itemInstance){
                const timestamp = item.timestamp
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
        this.questInProgress?.destroy()
    }
}