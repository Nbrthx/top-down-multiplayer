import { Game } from '../GameServer'
import p from 'planck'

export class Player{

    speed = 1.2

    scene: Game
    pBody: p.Body

    constructor(scene: Game, x: number, y: number){
        this.scene = scene

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
    }

    update(){
        //
    }
}