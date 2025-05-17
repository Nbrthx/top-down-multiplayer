import p from "planck";
import { Game } from "../../scenes/Game";
import { BaseWeapon } from "../BaseWeapon";

export class BasicMelee extends BaseWeapon{

    image: Phaser.GameObjects.Sprite;
    hitbox: p.Body;
    attackState: boolean;

    attackDelay: number

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
        
        scene.add.existing(this);
        this.config = config
        
        this.attackState = false

        this.image = scene.add.sprite(128*config.offsetMultipler, 0, config.texture)
        this.image.setScale(4)
        this.image.setVisible(false)

        this.hitbox = scene.world.createKinematicBody();
        this.hitbox.createFixture({
            shape: new p.Box(config.hitboxSize.width, config.hitboxSize.height, new p.Vec2(0, 0)),
            isSensor: true
        })
        this.hitbox.setActive(false); // Nonaktifkan awal

        this.timestamp = 0
        this.cooldown = config.cooldown

        this.add(this.image)
    }

    attack(x: number, y: number){
        if(this.image.visible) return
        if(!this.canAttack()) return

        this.timestamp = Date.now()

        this.image.setFlipY(this.attackState)
        this.attackState = !this.attackState

        this.image.play(this.config.texture+'-attack', true)
        this.image.setVisible(true)

        const rad = Math.atan2(y, x)
        this.setRotation(rad)

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

        this.image.once('animationcomplete', () => {
            this.image.setVisible(false)
        })
    }

    destroy(){
        this.scene.contactEvents.destroyEventByBody(this.hitbox)
        this.hitbox.getWorld().queueUpdate(world => {
            world.destroyBody(this.hitbox)
        })
        super.destroy()
    }
}