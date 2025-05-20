import p from 'planck'
import { Game } from '../scenes/Game'
import { Enemy } from '../prefabs/Enemy'

export class MapSetup{

    scene: Game
    gameScale: number
    collision: p.Body[]

    constructor(scene: Game, mapName: string){
        this.collision = []
        this.scene = scene
        this.gameScale = scene.gameScale

        const map = scene.add.tilemap(mapName)
        const tileset = map.addTilesetImage('tilemaps', 'tilemaps') as Phaser.Tilemaps.Tileset
        const waterLayer = map.createLayer('water', tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer
        const groundLayer = map.createLayer('ground', tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer
        const grassLayer = map.createLayer('grass', tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer
        const otherLayer = map.createLayer('other', tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer

        [waterLayer, groundLayer, grassLayer, otherLayer].forEach(v => {
            v.setScale(4)
        })

        scene.camera.setBounds(0, 0, map.widthInPixels*this.gameScale, map.heightInPixels*this.gameScale)

        this.initCollision(scene, map)
        this.createEnemy(scene, map)
        this.createBounds(map.width, map.height)
    }

    initCollision(scene: Game, map: Phaser.Tilemaps.Tilemap){
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

    createEnemy(scene: Game, map: Phaser.Tilemaps.Tilemap){
        map.getObjectLayer('enemys')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, name: string }

            const enemy = new Enemy(scene, o.x*scene.gameScale, o.y*scene.gameScale, o.name)

            scene.enemies.push(enemy)
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