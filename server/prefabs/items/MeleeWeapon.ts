import * as p from "planck";
import { Game } from "../../GameWorld";
import { BaseItem } from "../BaseItem";

export interface Melee{
    texture: string
    offsetMultipler: number
    hitboxSize: {
        width: number
        height: number
    }
    hitboxOffsetMultipler: number
    cooldown: number
    attackDelay: number
    damage: number
    knockback: number
    force: number
}

export class MeleeWeapon extends BaseItem{

    config: Melee
    hitbox: p.Body;
    attackState: boolean;

    constructor(scene: Game, parentBody: p.Body, config: Melee){
        super(scene, parentBody);
        
        this.config = config
        
        this.attackState = false

        this.hitbox = scene.world.createKinematicBody();
        this.hitbox.createFixture({
            shape: new p.Box(config.hitboxSize.width, config.hitboxSize.height, new p.Vec2(0, 0)),
            isSensor: true
        })
        this.hitbox.setActive(false); // Nonaktifkan awal
        this.hitbox.setUserData(this)

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