import { Game } from '../GameWorld'
import p from 'planck'

export class Player{

    id: string
    speed = 1.2

    scene: Game
    pBody: p.Body

    constructor(scene: Game, x: number, y: number, id: string){
        this.scene = scene
        this.id = id

        this.pBody = scene.world.createDynamicBody({
            position: new p.Vec2(x/scene.gameScale/32, y/scene.gameScale/32),
            fixedRotation: true
        })
        this.pBody.createFixture({
            shape: new p.Box(0.3, 0.5, new p.Vec2(0, 0.4)),
            filterCategoryBits: 2,
            filterMaskBits: 1,
        })
    }

    update(){
        //
    }

    destroy(){
        this.scene.world.destroyBody(this.pBody)
    }
}