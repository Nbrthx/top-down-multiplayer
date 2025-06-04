import p from "planck";
import { Game } from "../../scenes/Game";
import { BaseItem } from "../BaseItem";
import { SpatialSound } from "../../components/SpatialAudio";

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
}

export class RangeWeapon extends BaseItem{

    sprite: Phaser.GameObjects.Sprite;
    config: Range
    useSound: SpatialSound
    attackState: boolean;

    constructor(scene: Game, parentBody: p.Body, config: Range){
        super(scene, parentBody);
        
        scene.add.existing(this);
        this.config = config
        
        this.attackState = false

        this.sprite = scene.add.sprite(128*config.offsetMultipler, 0, config.texture)
        this.sprite.setScale(4)
        this.sprite.setVisible(false)

        this.useSound = scene.spatialAudio.addSound('audio-'+config.texture)

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
        this.useSound.playSound(audioPos.x+x, audioPos.y+y, true, false)

        setTimeout(() => {
            const pos = new p.Vec2()
            pos.x = this.parentBody.getPosition().x + Math.cos(rad) * this.config.offsetMultipler
            pos.y = this.parentBody.getPosition().y + 0.1 + Math.sin(rad) * this.config.offsetMultipler
            
            // const projectile = new Projectile(this.scene, pos, new p.Vec2(Math.cos(rad), Math.sin(rad)), {
            //     texture: this.config.projectileTexture,
            //     speed: this.config.speed,
            //     range: this.config.range,
            //     hitboxSize: {
            //         width: this.config.hitboxSize.width,
            //         height: this.config.hitboxSize.height
            //     }
            // })
            // this.scene.projectiles.push(projectile)
        }, this.config.attackDelay)

        this.sprite.once('animationcomplete', () => {
            this.sprite.setVisible(false)
        })
    }

    destroy(){
        super.destroy()
    }
}

export interface ProjectileConfig {
    texture: string
    speed: number
    range: number
    hitboxSize: {
        width: number
        height: number
    }
}

export class Projectile extends Phaser.GameObjects.Image {

    scene: Game;
    uid: string;
    pBody: p.Body;
    dir: p.Vec2;
    config: ProjectileConfig

    constructor(scene: Game, pos: p.Vec2, dir: p.Vec2, config: ProjectileConfig, uid: string) {
        super(scene, pos.x*scene.gameScale*32, pos.y*scene.gameScale*32, config.texture);

        this.setRotation(Math.atan2(dir.y, dir.x))

        this.scene = scene
        this.uid = uid
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

        this.setScale(scene.gameScale)
        
        scene.add.existing(this)
    }
    

    update() {
        if(this.dir.x != 0 || this.dir.y != 0){
            this.setDepth(this.y/this.scene.gameScale)

            this.x = this.pBody.getPosition().x * this.scene.gameScale * 32
            this.y = this.pBody.getPosition().y * this.scene.gameScale * 32
        }
    }

    destroy(){
        super.destroy()
        this.pBody.getWorld().queueUpdate(world => {
            world.destroyBody(this.pBody)
        })
    }
}