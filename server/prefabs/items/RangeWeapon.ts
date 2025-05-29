import p from "planck";
import { Game } from "../../GameWorld";
import { BaseItem } from "../BaseItem";

interface Range{
    texture: string
    projectileTexture: string
    offsetMultipler: number
    speed: number
    range: number
    hitboxSize: {
        width: number
        height: number
    }
    cooldown: number
    attackDelay: number
    damage: number
    knockback: number
}

export class RangeWeapon extends BaseItem{

    config: Range
    attackState: boolean;

    attackDelay: number
    attackDir: p.Vec2

    constructor(scene: Game, parentBody: p.Body, config: Range){
        super(scene, parentBody);
        
        this.config = config
        
        this.attackState = false

        this.timestamp = 0
        this.cooldown = config.cooldown
    }

    use(x: number, y: number){
        if(!this.canUse()) return

        this.timestamp = Date.now()

        this.attackState = !this.attackState
        this.attackDir = new p.Vec2(x, y)

        const rad = Math.atan2(y, x)

        setTimeout(() => {
            const pos = new p.Vec2()
            pos.x = this.parentBody.getPosition().x + Math.cos(rad) * this.config.offsetMultipler
            pos.y = this.parentBody.getPosition().y + 0.1 + Math.sin(rad) * this.config.offsetMultipler
            
            const projectile = new Projectile(this.scene, this.parentBody,pos, new p.Vec2(Math.cos(rad), Math.sin(rad)), {
                texture: this.config.projectileTexture,
                speed: this.config.speed,
                range: this.config.range,
                hitboxSize: {
                    width: this.config.hitboxSize.width,
                    height: this.config.hitboxSize.height
                },
                damage: this.config.damage,
                knockback: this.config.knockback
            })

            this.scene.projectiles.push(projectile)
            this.scene.projectileBodys.push(projectile.pBody)
        }, this.config.attackDelay)
    }
}

interface ProjectileConfig {
    texture: string
    speed: number
    range: number
    hitboxSize: {
        width: number
        height: number
    }
    damage: number
    knockback: number
}

export class Projectile{

    scene: Game;
    parentBody: p.Body;
    uid: string;
    pBody: p.Body;
    dir: p.Vec2;
    config: ProjectileConfig

    constructor(scene: Game, parentBody: p.Body, pos: p.Vec2, dir: p.Vec2, config: ProjectileConfig) {
        this.scene = scene
        this.parentBody = parentBody
        this.uid = crypto.randomUUID()
        this.dir = new p.Vec2(dir.x, dir.y)
        this.config = config

        this.pBody = scene.world.createDynamicBody({
            position: new p.Vec2(pos.x, pos.y),
            bullet: true
        })
        this.pBody.createFixture({ 
            shape: new p.Box(config.hitboxSize.width, config.hitboxSize.height),
            isSensor: true
        })
        this.pBody.setUserData(this)
        this.pBody.setAngle(Math.atan2(dir.y, dir.x))

        setTimeout(() => {
            this.destroy()
        }, (this.config.range*5) / (this.config.speed/60))
    }

    update() {
        if(this.dir.x != 0 || this.dir.y != 0){
            this.pBody.setLinearVelocity(this.dir)
            this.pBody.getLinearVelocity().normalize()
            this.pBody.getLinearVelocity().mul(this.config.speed)
        }
    }

    destroy(){
        this.pBody.getWorld().queueUpdate(world => {
            world.destroyBody(this.pBody)
            this.scene.projectileBodys.splice(this.scene.projectileBodys.indexOf(this.pBody), 1)
            this.scene.projectiles.splice(this.scene.projectiles.indexOf(this), 1)
        })
    }
}