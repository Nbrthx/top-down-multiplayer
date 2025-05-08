import p from "planck"
import { Game } from "../GameWorld";

export class Weapon{

    scene: Game
    parent: p.Body
    hitbox: p.Body;
    timestamp: number
    attackDir: p.Vec2
    cooldown: number

    constructor(scene: Game, parent: p.Body){
        this.parent = parent
        this.scene = scene

        this.hitbox = scene.world.createKinematicBody();
        this.hitbox.createFixture({
            shape: new p.Box(0.7, 0.2, new p.Vec2(0, 0)),
            isSensor: true
        });
        this.hitbox.setUserData(this);
        this.hitbox.setActive(false); // Nonaktifkan awal

        this.timestamp = 0
        this.cooldown = 500
    }

    attack(rad: number){
        if(this.timestamp+this.cooldown > Date.now()) return false
        this.timestamp = Date.now()

        this.attackDir = new p.Vec2(Math.cos(rad), Math.sin(rad));

        setTimeout(() => {
            this.hitbox.setPosition(
                new p.Vec2(
                    (this.parent.getPosition().x + Math.cos(rad) * 1.1),
                    (this.parent.getPosition().y + 0.1 + Math.sin(rad) * 1.1)
                )
            );
            this.hitbox.setAngle(rad)
            this.hitbox.setActive(true) 
            setTimeout(() => {
                this.hitbox.setActive(false);
                this.attackDir = new p.Vec2(0, 0); // Bersihkan vektor serangan setelah selesai
            }, 1000/20)
        }, 1000/20*3)

        return true
    }

    destroy(){
        this.scene.contactEvents.destroyEventByBody(this.hitbox)
        this.hitbox.getWorld().queueUpdate(world => {
            world.destroyBody(this.hitbox)
        })
    }
}
