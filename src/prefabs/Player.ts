import { Game } from '../scenes/Game'
import p from 'planck'
import { BaseWeapon } from './BaseWeapon'
import { AnyWeapon } from './WeaponList'
import { Inventory } from './Inventory'

export class Player extends Phaser.GameObjects.Container{

    id: string
    maxHealth: number
    health: number
    speed = 1.4

    scene: Game
    weapon: BaseWeapon
    sprite: Phaser.GameObjects.Sprite
    healthBar: Phaser.GameObjects.Rectangle
    inventory: Inventory

    pBody: p.Body
    attackDir: p.Vec2

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
            shape: new p.Box(0.3, 0.4, new p.Vec2(0, 0.5)),
            filterCategoryBits: 2,
            filterMaskBits: 1,
        })

        this.inventory = new Inventory(this)

        this.maxHealth = 100
        this.health = this.maxHealth

        const bar = scene.add.rectangle(0, -120, 162, 14, 0x696669)
        this.healthBar = scene.add.rectangle(0, -120, 162, 14, 0x44ff55)

        this.attackDir = new p.Vec2(0, 0)
        this.weapon = new AnyWeapon(scene, this.pBody, 'punch').weaponInstance

        this.sprite = scene.add.sprite(0, -16, 'char').setScale(scene.gameScale)

        this.add([this.weapon, this.sprite, bar, this.healthBar])
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
            if(this.weapon) this.weapon.attack(this.attackDir.x, this.attackDir.y)
            this.attackDir = new p.Vec2(0, 0)
        }

        this.setDepth(this.y/this.scene.gameScale)

        this.x = this.pBody.getPosition().x*this.scene.gameScale*32
        this.y = this.pBody.getPosition().y*this.scene.gameScale*32
        
        this.healthBar.setSize(160*this.health/this.maxHealth, 12)
        this.healthBar.setX(-80-80*this.health/-this.maxHealth)
    }

    equipItem(item: string){
        if(this.weapon) this.remove(this.weapon, true)

        const newWeapon = new AnyWeapon(this.scene, this.pBody, item).weaponInstance
        newWeapon.timestamp = Date.now()+1000

        this.weapon = newWeapon
        this.addAt(this.weapon, 0)

        console.log(item)
    }

    destroy() {
        this.scene.world.destroyBody(this.pBody)
        this.scene.contactEvents.destroyEventByBody(this.pBody)
        if(this.weapon) this.weapon.destroy()
        super.destroy()
    }
}