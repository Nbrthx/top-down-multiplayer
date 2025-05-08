import p from 'planck'
import * as fs from 'fs'
import { Game } from '../GameWorld'

interface Tilemap{
    width: number
    height: number
    layers: {
        name: string
        objects: {
            name: string
            x: number
            y: number
            width: number
            height: number
        }[]
    }[]
}

export class MapSetup{

    scene: Game
    gameScale: number
    collision: p.Body[]

    constructor(scene: Game, mapName: string){
        this.collision = []
        this.scene = scene
        this.gameScale = scene.gameScale

        const map = JSON.parse(fs.readFileSync(__dirname+'/../json/'+mapName+'.json', {encoding: 'utf8'}))

        this.createBounds(map.width, map.height)

        this.initCollision(scene, map)
    }

    initCollision(scene: Game, map: Tilemap){
        map.layers.find(v => v.name == 'collision')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, width: number, height: number }

            const body = scene.world.createBody(new p.Vec2((o.x)/32, (o.y)/32))
            body.createFixture(new p.Box(o.width/2/32, o.height/2/32, new p.Vec2(o.width/2/32, o.height/2/32)))
            this.collision.push(body)
        })

        map.layers.find(v => v.name == 'tree1')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number }

            const body = scene.world.createBody(new p.Vec2((o.x+16/32)/32, (o.y+24/32)/32))
            body.createFixture(new p.Box(16/2/32, 10/2/32))
            this.collision.push(body)
        })

        map.layers.find(v => v.name == 'tree2')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number }

            const body = scene.world.createBody(new p.Vec2((o.x)/32, (o.y+120/32)/32))
            body.createFixture(new p.Box(28/2/32, 10/2/32))
            this.collision.push(body)
        })

        map.layers.find(v => v.name == 'home1')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number }

            const body = scene.world.createBody(new p.Vec2((o.x)/32, (o.y+2)/32))
            body.createFixture(new p.Box(42/2/32, 10/2/32))
            this.collision.push(body)
        })
    }

    createBounds(width: number, height: number){
        const walls = [
            { pos: new p.Vec2(width/2, -0.5), size: new p.Vec2(width, 1) },  // top
            { pos: new p.Vec2(-0.5, height/2), size: new p.Vec2(1, height) },   // left
            { pos: new p.Vec2(width+0.5, height/2), size: new p.Vec2(1, height) },  // right
            { pos: new p.Vec2(width/2, height+0.5), size: new p.Vec2(width, 1) },   // bottom
        ];

        walls.forEach(wall => {
            const body = this.scene.world.createBody(wall.pos);
            body.createFixture(new p.Box(wall.size.x / 2, wall.size.y / 2));
        });
    }
}