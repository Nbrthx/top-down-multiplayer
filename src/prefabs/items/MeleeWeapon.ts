import p from "planck";
import { Game } from "../../scenes/Game";
import { BaseItem } from "../BaseItem";
import { SpatialSound } from "../../components/SpatialAudio";

export class MeleeWeapon extends BaseItem{

    sprite: Phaser.GameObjects.Sprite;
    useSound: SpatialSound
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

        this.sprite = scene.add.sprite(128*config.offsetMultipler, 0, config.texture)
        this.sprite.setScale(4)
        this.sprite.setVisible(false)

        this.useSound = scene.spatialAudio.addSound('audio-'+config.texture)

        this.hitbox = scene.world.createKinematicBody();
        this.hitbox.createFixture({
            shape: new p.Box(config.hitboxSize.width, config.hitboxSize.height, new p.Vec2(0, 0)),
            isSensor: true
        })
        this.hitbox.setActive(false); // Nonaktifkan awal

        this.timestamp = 0
        this.cooldown = config.cooldown

        this.add(this.sprite)
    }

    use(x: number, y: number){
        if(this.sprite.visible) return
        if(!this.canUse()) return

        this.timestamp = Date.now()

        this.sprite.setFlipY(this.attackState)
        this.attackState = !this.attackState

        this.sprite.play(this.config.texture+'-attack', true)
        this.sprite.setVisible(true)

        const rad = Math.atan2(y, x)
        this.setRotation(rad)

        const audioPos = this.parentBody.getPosition()
        this.useSound.playSound(audioPos.x, audioPos.y, true, false)

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

        this.sprite.once('animationcomplete', () => {
            this.sprite.setVisible(false)
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