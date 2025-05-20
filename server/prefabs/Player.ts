import { Game } from '../GameWorld'
import * as p from 'planck'
import { Account } from '../server'
import { Inventory } from './Inventory'
import { BaseItem } from './BaseItem'
import { ItemInstance } from './ItemInstance'

export class Player{

    account: Account

    id: string
    health: number
    maxHealth: number
    speed = 1.4

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
            shape: new p.Box(0.3, 0.4, new p.Vec2(0, 0.5)),
            filterCategoryBits: 2,
            filterMaskBits: 1,
        })
        this.pBody.setUserData(this)

        this.inventory = new Inventory(this)

        this.maxHealth = 100
        this.health = this.maxHealth

        this.itemInstance = new ItemInstance(scene, this.pBody, 'punch').weaponInstance

        this.attackDir = new p.Vec2(0, 0)

        this.knockback = 0
        this.knockbackDir = new p.Vec2(0, 0)
    }

    update(){
        if(this.attackDir.length() > 0){
            this.itemInstance.use(this.attackDir.x, this.attackDir.y)
            this.attackDir = new p.Vec2(0, 0)
        }

        if(this.knockback > 0){
            this.pBody.applyLinearImpulse(new p.Vec2(this.knockbackDir.x*this.knockback, this.knockbackDir.y*this.knockback), this.pBody.getWorldCenter())
            this.knockback -= 0.5
        }

    }

    equipItem(item: string){
        if(this.itemInstance) this.itemInstance.destroy()

        const newItemInstance = new ItemInstance(this.scene, this.pBody, item).weaponInstance
        newItemInstance.timestamp = Date.now()+1000

        this.itemInstance = newItemInstance

        console.log(item)
    }

    destroy(){
        this.scene.world.destroyBody(this.pBody)
        this.scene.contactEvents.destroyEventByBody(this.pBody)
        this.itemInstance.destroy()
    }
}