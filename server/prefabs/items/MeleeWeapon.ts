import * as p from "planck";
import { Game } from "../../GameWorld";
import { BaseItem } from "../BaseItem";
import { Player } from "../Player";
import { Enemy } from "../Enemy";

interface Melee{
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
}

export class MeleeWeapon extends BaseItem{

    config: Melee
    hitbox: p.Body;
    attackState: boolean;

    attackDelay: number
    attackDir: p.Vec2

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

        this.timestamp = 0
        this.cooldown = config.cooldown

        this.scene.contactEvents.addEvent(this.hitbox, this.scene.entityBodys, (_bodyA, bodyB) => {
            const parent = parentBody.getUserData() 
            const target = bodyB.getUserData()

            const isPlayer = (obj: any) => obj instanceof Player
            const isEnemy = (obj: any) => obj instanceof Enemy

            const hit = () => {
                if(!isEnemy(target) && !isPlayer(target)) return;
                if (this.attackDir.length() > 0) {
                    target.health -= config.damage;
                    target.knockback = config.knockback;
                    target.knockbackDir = new p.Vec2(this.attackDir.x, this.attackDir.y);
                }
            }
            
            if(isPlayer(parent) && isPlayer(target)){
                if(target.id == parent.id) return
                if(!this.scene.isPvpAllowed) return

                hit()
            }
            else if((isPlayer(parent) && isEnemy(target)) || (isEnemy(parent) && isPlayer(target))){
                hit()
            }
        })
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