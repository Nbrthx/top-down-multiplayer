import { Game } from '../scenes/Game'
import p from 'planck'

export class Player extends Phaser.GameObjects.Container{

    speed = 1.2

    scene: Game
    pBody: p.Body
    sprite: Phaser.GameObjects.Sprite

    constructor(scene: Game, x: number, y: number){
        super(scene, x, y)

        this.scene = scene
        scene.add.existing(this)

        this.pBody = scene.world.createDynamicBody({
            position: new p.Vec2(x/scene.gameScale/32, y/scene.gameScale/32),
            fixedRotation: true
        })
        this.pBody.createFixture({
            shape: new p.Box(0.4, 0.3, new p.Vec2(0, 0.2)),
            filterCategoryBits: 2,
            filterMaskBits: 1,
        })

        console.log(this.pBody, this.pBody.getPosition())

        this.sprite = scene.add.sprite(0, 0, 'char').setScale(scene.gameScale)

        this.add([this.sprite])
    }

    update(){
        const vel = this.pBody.getLinearVelocity()

        if(vel.x != 0 || vel.y != 0){
            if(vel.y >= 0) this.sprite.play('run-down', true)
            else this.sprite.play('run-up', true)
        
            if(vel.x > 0) this.sprite.flipX = false
            else if(vel.x < 0) this.sprite.flipX = true
        }
        else this.sprite.play('idle', true)

        this.setDepth(this.y/this.scene.gameScale)

        this.x = this.pBody.getPosition().x*this.scene.gameScale*32
        this.y = this.pBody.getPosition().y*this.scene.gameScale*32
    }
}