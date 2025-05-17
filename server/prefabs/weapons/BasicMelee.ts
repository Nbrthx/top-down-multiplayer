import p from "planck";
import { Game } from "../../GameWorld";
import { BaseWeapon } from "../BaseWeapon";
import { Player } from "../Player";

export class BasicMelee extends BaseWeapon{

    hitbox: p.Body;
    attackState: boolean;

    attackDelay: number
    attackDir: p.Vec2

    constructor(scene: Game, parentBody: p.Body, config: {
        texture: string
        offsetMultipler: number
        hitboxSize: {
            width: number
            height: number
        }
        hitboxOffsetMultipler: number
        cooldown: number
        attackDelay: number
    }){
        super(scene, parentBody);
        
        this.config = config
        
        this.attackState = false

        this.hitbox = scene.world.createKinematicBody();
        this.hitbox.createFixture({
            shape: new p.Box(config.hitboxSize.width, config.hitboxSize.height, new p.Vec2(0, 0)),
            isSensor: true
        })
        this.hitbox.setActive(false); // Nonaktifkan awal

        this.timestamp = 0
        this.cooldown = config.cooldown

        this.scene.contactEvents.addEvent(this.hitbox, this.scene.playerBodys, (_bodyA, bodyB) => {
            const player = parentBody.getUserData() as Player
            const other = bodyB.getUserData() as Player

            if(other.id == player.id) return

            if (this.attackDir.length() > 0) {
                other.health -= 5;
                other.knockback = 4;
                other.knockbackDir = new p.Vec2(this.attackDir.x, this.attackDir.y);
            }
        })
    }

    attack(x: number, y: number){
        if(!this.canAttack()) return

        this.timestamp = Date.now()

        this.attackState = !this.attackState
        this.attackDir = new p.Vec2(x, y)

        const rad = Math.atan2(y, x)

        setTimeout(() => {
            this.hitbox.setPosition(
                new p.Vec2(
                    (this.parentBody.getPosition().x + Math.cos(rad) * this.config.hitboxOffsetMultipler),
                    (this.parentBody.getPosition().y + 0.1 + Math.sin(rad) * this.config.hitboxOffsetMultipler)
                )
            );
            this.hitbox.setAngle(rad)
            this.hitbox.setActive(true)
            
            setTimeout(() => {
                this.hitbox.setActive(false)
                this.attackDir = new p.Vec2(0, 0)
            }, 100)
        }, this.config.attackDelay)
    }

    destroy(){
        this.scene.contactEvents.destroyEventByBody(this.hitbox)
        this.hitbox.getWorld().queueUpdate(world => {
            world.destroyBody(this.hitbox)
        })
    }
}