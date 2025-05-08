import { Game } from '../GameWorld'
import p from 'planck'
import { Weapon } from './Weapon'

export class Player{

    id: string
    health: number
    maxHealth: number
    speed = 1.4

    scene: Game
    pBody: p.Body
    weapon: Weapon
    attackDir: p.Vec2
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
            shape: new p.Box(0.3, 0.5, new p.Vec2(0, 0.4)),
            filterCategoryBits: 2,
            filterMaskBits: 1,
        })
        this.pBody.setUserData(this)

        this.maxHealth = 100
        this.health = this.maxHealth

        this.weapon = new Weapon(scene, this.pBody)

        this.attackDir = new p.Vec2(0, 0)

        this.knockback = 0
        this.knockbackDir = new p.Vec2(0, 0)
    }

    update(){
        if(this.attackDir.length() > 0){
            this.weapon.attack(Math.atan2(this.attackDir.y, this.attackDir.x))
            this.attackDir = new p.Vec2(0, 0)
        }

        if(this.knockback > 0){
            this.pBody.applyLinearImpulse(new p.Vec2(this.knockbackDir.x*this.knockback, this.knockbackDir.y*this.knockback), this.pBody.getWorldCenter())
            this.knockback -= 0.5
        }

    }

    destroy(){
        this.scene.world.destroyBody(this.pBody)
        this.scene.contactEvents.destroyEventByBody(this.pBody)
        this.weapon.destroy()
    }
}