import * as p from 'planck'
import * as fs from 'fs'
import { Game } from '../GameWorld'
import { Enemy } from '../prefabs/Enemy'
import { Player } from '../prefabs/Player'

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
    waterCollision: p.Body[]
    enterpoint: Map<string, p.Vec2>

    constructor(scene: Game, mapName: string){
        this.collision = []
        this.waterCollision = []
        this.enterpoint = new Map()

        this.scene = scene
        this.gameScale = scene.gameScale

        const map = JSON.parse(fs.readFileSync(__dirname+'/../json/map/'+mapName+'.json', {encoding: 'utf8'}))

        this.initCollision(map)
        this.createEnemy(map)
        this.createEntrances(map)
        this.createHealArea(map)
        this.createBounds(map.width, map.height)
        this.createEnterPoint(map)
    }

    initCollision(map: Tilemap){
        const scene = this.scene

        map.layers.find(v => v.name == 'collision')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, width: number, height: number }

            const body = scene.world.createBody(new p.Vec2((o.x)/32, (o.y)/32))
            body.createFixture(new p.Box(o.width/2/32, o.height/2/32, new p.Vec2(o.width/2/32, o.height/2/32)))
            body.setUserData({ width: o.width, height: o.height })
            this.collision.push(body)
        })

        map.layers.find(v => v.name == 'waterColl')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, width: number, height: number }

            const body = scene.world.createBody(new p.Vec2((o.x)/32, (o.y)/32))
            body.createFixture(new p.Box(o.width/2/32, o.height/2/32, new p.Vec2(o.width/2/32, o.height/2/32)))
            body.setUserData({ width: o.width, height: o.height })
            this.waterCollision.push(body)
        })

        map.layers.find(v => v.name == 'tree1')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number }

            const body = scene.world.createBody(new p.Vec2((o.x+16/32)/32, (o.y+24/32)/32))
            body.createFixture(new p.Box(24/2/32, 16/2/32))
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

    createEnemy(map: Tilemap){
        const scene = this.scene

        map.layers.find(v => v.name == 'enemies')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, name: string }

            const enemy = new Enemy(scene, o.x*scene.gameScale, o.y*scene.gameScale, o.name)

            scene.entityBodys.push(enemy.pBody)
            scene.enemies.push(enemy)
        })
    }

    createEntrances(map: Tilemap){
        const scene = this.scene

        map.layers.find(v => v.name == 'entrance')?.objects.forEach(_o => {
            const o = _o as { name: string, x: number, y: number, width: number, height: number}

            const body = scene.world.createKinematicBody(new p.Vec2((o.x+o.width/2)/32, (o.y+o.height/2)/32))
            body.createFixture({
                shape: new p.Box(o.width/2/32, o.height/2/32),
                isSensor: true
            })
            body.setUserData(o.name)

            scene.contactEvents.addEvent(scene.entityBodys, body, (bodyA) => {
                const player = bodyA.getUserData()

                if(!(player instanceof Player)) return

                scene.world.queueUpdate(() => {
                    const isPvpAllowed = scene.gameManager.getWorld(o.name)?.isPvpAllowed || false
                    const requiredLevel = scene.gameManager.getWorld(o.name)?.requiredLevel || 0

                    scene.gameManager.playerChangeWorld.set(player.uid, o.name)
                    scene.gameManager.io.to(player.uid).emit('changeWorld', scene.id, o.name, isPvpAllowed, requiredLevel)
                })
            })
        })
    }

    createHealArea(map: Tilemap){
        const scene = this.scene

        map.layers.find(v => v.name == 'heal')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, width: number, height: number}

            const body = scene.world.createKinematicBody(new p.Vec2((o.x+o.width/2)/32, (o.y+o.height/2)/32))
            body.createFixture({
                shape: new p.Box(o.width/2/32-0.2, o.height/2/32-0.2),
                isSensor: true
            })
            body.setUserData('heal')
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

    createEnterPoint(map: Tilemap) {
        const scene = this.scene

        let gameScale = scene.gameScale
        map.layers.find(v => v.name == 'enterpoint')?.objects.forEach(_o => {
            const o = _o as { name: string, x: number, y: number }
            
            const pos = new p.Vec2(o.x*gameScale, o.y*gameScale)
            this.enterpoint.set(o.name, pos)
        })
    }
}