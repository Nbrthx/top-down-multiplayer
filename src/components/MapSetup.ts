import p from 'planck'
import { Game } from '../scenes/Game'
import { Enemy } from '../prefabs/Enemy'

export class MapSetup{

    scene: Game
    gameScale: number
    layers: Phaser.Tilemaps.TilemapLayer[]
    collision: p.Body[]
    entrances: p.Body[]
    enterpoint: Map<string, p.Vec2>

    constructor(scene: Game, mapName: string){
        this.scene = scene
        this.gameScale = scene.gameScale
        
        this.layers = []
        this.collision = []
        this.entrances = []
        this.enterpoint = new Map()

        const map = scene.add.tilemap(mapName)
        const tileset = map.addTilesetImage('tilemaps', 'tilemaps') as Phaser.Tilemaps.Tileset

        map.layers.forEach(v => {
            const layer = map.createLayer(v.name, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer
            layer.setScale(4)
            this.layers.push(layer)
        })

        scene.camera.setBounds(0, 0, map.widthInPixels*this.gameScale, map.heightInPixels*this.gameScale)

        this.initCollision(map)
        this.createEnemy(map)
        this.createBounds(map.width, map.height)
        this.createEntrances(map)
        this.createEnterPoint(map)
    }

    initCollision(map: Phaser.Tilemaps.Tilemap){
        const scene = this.scene

        map.getObjectLayer('collision')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, width: number, height: number}
            const body = scene.world.createBody(new p.Vec2((o.x)/32, (o.y)/32))
            body.createFixture(new p.Box(o.width/2/32, o.height/2/32, new p.Vec2(o.width/2/32, o.height/2/32)))
            this.collision.push(body)
        })

        let i = 0
        map.getObjectLayer('tree1')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number }
            const tree = scene.add.image(o.x*scene.gameScale, o.y*scene.gameScale, 'tree1')
            tree.setScale(scene.gameScale).setOrigin(0.5, 0.9).setDepth(o.y)
            tree.setTint(i%2 == 0 ? 0xeeffee : 0xffffcc)

            const body = scene.world.createBody(new p.Vec2((o.x+16/32)/32, (o.y+24/32)/32))
            body.createFixture(new p.Box(16/2/32, 10/2/32))
            this.collision.push(body)
            i++
        })

        map.getObjectLayer('tree2')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number }
            const tree = scene.add.image(o.x*scene.gameScale, o.y*scene.gameScale, 'tree2')
            tree.setScale(scene.gameScale).setOrigin(0.5, 0.8).setDepth(o.y)

            const body = scene.world.createBody(new p.Vec2((o.x)/32, (o.y+120/32)/32))
            body.createFixture(new p.Box(28/2/32, 10/2/32))
            this.collision.push(body)
        })

        map.getObjectLayer('home1')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number }
            const tree = scene.add.image(o.x*scene.gameScale, o.y*scene.gameScale, 'home1')
            tree.setScale(scene.gameScale).setOrigin(0.5, 0.8).setDepth(o.y)

            const body = scene.world.createBody(new p.Vec2((o.x)/32, (o.y+2)/32))
            body.createFixture(new p.Box(42/2/32, 10/2/32))
            this.collision.push(body)
        })
    }

    createEnemy(map: Phaser.Tilemaps.Tilemap){
        const scene = this.scene


        map.getObjectLayer('enemys')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, name: string }

            const enemy = new Enemy(scene, o.x*scene.gameScale, o.y*scene.gameScale, o.name)

            scene.enemies.push(enemy)
        })
    }

    createEntrances(map: Phaser.Tilemaps.Tilemap){
        const scene = this.scene

        map.getObjectLayer('entrance')?.objects.map(_o => {
            const o = _o as { name: string, x: number, y: number, width: number, height: number}

            const body = scene.world.createKinematicBody(new p.Vec2((o.x+o.width/2)/32, (o.y+o.height/2)/32))
            body.createFixture({
                shape: new p.Box(o.width/2/32, o.height/2/32),
                isSensor: true
            })
            body.setUserData(o.name)
            this.entrances.push(body)
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
            this.collision.push(body)
        });
    }

    destroy(){
        this.collision.forEach(v => {
            this.scene.world.destroyBody(v)
        })
        this.collision = []
        this.scene.others.forEach(v => {
            v.destroy()
        })
        this.scene.others = []
        this.scene.enemies.forEach(v => {
            v.destroy()
        })
        this.scene.enemies = []
        this.layers.forEach(v => {
            v.destroy()
        })
        this.layers = []
        this.scene.droppedItems.forEach(v => {
            v.destroy()
        })
        this.scene.droppedItems = []
        this.entrances.forEach(v => {
            this.scene.world.destroyBody(v)
        })
        this.entrances = []
    }

    createEnterPoint(map: Phaser.Tilemaps.Tilemap) {
        const scene = this.scene

        let gameScale = scene.gameScale
        map.getObjectLayer('enterpoint')?.objects.forEach(_o => {
            const o = _o as { name: string, x: number, y: number }
            
            const pos = new p.Vec2(o.x*gameScale, o.y*gameScale)
            this.enterpoint.set(o.name, pos)
        })
    }
}