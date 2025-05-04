import planck from "planck";
import { Game } from "../scenes/Game";

export class Weapon extends Phaser.GameObjects.Container{

    scene: Game
    image: Phaser.GameObjects.Sprite;
    hitbox: planck.Body;
    parentBody: planck.Body
    attackState: boolean;

    constructor(scene: Game, parentBody: planck.Body, texture: string){
        super(scene, 0, 16);
        this.scene = scene
        scene.add.existing(this);
        
        this.attackState = false

        this.image = scene.add.sprite(128, 0, texture)
        this.image.setScale(4)
        this.image.setVisible(false)

        this.parentBody = parentBody

        this.hitbox = scene.world.createKinematicBody();
        this.hitbox.createFixture({
            shape: new planck.Circle(new planck.Vec2(0, 0), 14/32),
            isSensor: true
        });
        this.hitbox.setActive(false); // Nonaktifkan awal

        this.add(this.image)
    }

    attack(rad: number){
        if(this.image.visible) return

        this.image.setFlipY(this.attackState)
        this.attackState = !this.attackState

        this.image.play('punching')
        this.image.setVisible(true)
        this.setRotation(rad)

        let enable = false
        this.image.on('animationupdate', (_animation: any, frame: Phaser.Animations.AnimationFrame) => {
            if(frame.index == 2 && !enable){
                enable = true
                
                this.hitbox.setPosition(
                    new planck.Vec2(
                        (this.parentBody.getPosition().x + Math.cos(rad) * 1.4),
                        (this.parentBody.getPosition().y + 0.1 + Math.sin(rad) * 1.4)
                    )
                );
                this.hitbox.setActive(true) 
            }
            else this.hitbox.setActive(false)
        })

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