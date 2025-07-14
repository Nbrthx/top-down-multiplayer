import p from 'planck'
import { Game } from '../scenes/Game'
import { NPC, NPCConfig } from '../prefabs/NPC'
import { handleQuest } from './HandleQuest'

export class MapSetup{

    scene: Game
    gameScale: number
    layers: Phaser.Tilemaps.TilemapLayer[]
    collision: p.Body[]
    entrances: p.Body[]
    healAreas: p.Body[]
    enterpoint: Map<string, p.Vec2>
    npcs: NPC[]

    constructor(scene: Game, mapName: string){
        this.scene = scene
        this.gameScale = scene.gameScale
        
        this.layers = []
        this.collision = []
        this.entrances = []
        this.healAreas = []
        this.enterpoint = new Map()
        this.npcs = []

        const map = scene.add.tilemap(mapName)
        const tileset = map.addTilesetImage('tilemaps2', 'tilemaps') as Phaser.Tilemaps.Tileset

        map.layers.forEach(v => {
            const layer = map.createLayer(v.name, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer
            layer.setScale(4).setPipeline('Light2D')
            this.layers.push(layer)
        })

        scene.camera.setBounds(0, 0, map.widthInPixels*this.gameScale, map.heightInPixels*this.gameScale+80)

        this.initCollision(map)
        this.createNPCs(map)
        this.createBounds(map.width, map.height)
        this.createEntrances(map)
        this.createHealArea(map)
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

        map.getObjectLayer('waterColl')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, width: number, height: number}
            const body = scene.world.createBody(new p.Vec2((o.x)/32, (o.y)/32))
            body.createFixture(new p.Box(o.width/2/32, o.height/2/32, new p.Vec2(o.width/2/32, o.height/2/32)))
            this.collision.push(body)
        })

        let i = 0
        map.getObjectLayer('tree1')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number }
            const tree = scene.add.sprite(o.x*scene.gameScale, (o.y-8)*scene.gameScale, 'tree1')
            tree.setScale(scene.gameScale).setOrigin(0.5, 0.85).setDepth(o.y-16)
            tree.setTint(i%2 == 0 ? 0xeeffee : 0xffffcc)
            tree.play('tree1-wave')
            tree.setPipeline('Light2D')

            const body = scene.world.createBody(new p.Vec2((o.x+16/32)/32, (o.y+24/32)/32))
            body.createFixture(new p.Box(24/2/32, 16/2/32))
            body.setUserData(tree)
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

    createNPCs(map: Phaser.Tilemaps.Tilemap){
        const scene = this.scene

        map.getObjectLayer('npcs')?.objects.forEach(_o => {
            const o = _o as { name: string, x: number, y: number, width: number, height: number}

            const npcList = scene.cache.json.get('npc-list') as NPCConfig[]

            const npc = new NPC(scene, o.x*this.gameScale, o.y*this.gameScale, o.name)
            const npcData = npcList.find(v => v.id == o.name) || {
                name: o.name,
                biography: 'No biography available.',
            }
            
            npc.askButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.event.preventDefault()
                scene.input.stopPropagation()

                handleQuest(scene, o.name, npcData.name, npcData.biography, { x: npc.x, y: npc.y })
            })

            this.npcs.push(npc)
        })
    }

    createEntrances(map: Phaser.Tilemaps.Tilemap){
        const scene = this.scene


        map.getObjectLayer('entrance')?.objects.forEach(_o => {
            const o = _o as { name: string, x: number, y: number, width: number, height: number}

            const entrance = scene.add.rectangle(o.x*scene.gameScale, o.y*scene.gameScale, o.width*scene.gameScale, o.height*scene.gameScale, 0xffff00, 0.8)
            entrance.setStrokeStyle(2, 0xcccc00)
            entrance.setOrigin(0).setAlpha(0.4)

            scene.tweens.add({
                targets: entrance,
                alpha: 0.1,
                duration: 500,
                ease: 'Quad.easeOut',
                yoyo: true,
                repeat: -1
            })

            const body = scene.world.createKinematicBody(new p.Vec2((o.x+o.width/2)/32, (o.y+o.height/2)/32))
            body.createFixture({
                shape: new p.Box(o.width/2/32, o.height/2/32),
                isSensor: true
            })
            body.setUserData(entrance)

            this.entrances.push(body)
        })
    }

    createHealArea(map: Phaser.Tilemaps.Tilemap){
        const scene = this.scene


        map.getObjectLayer('heal')?.objects.forEach(_o => {
            const o = _o as { x: number, y: number, width: number, height: number}

            const healArea = scene.add.rectangle(o.x*scene.gameScale, o.y*scene.gameScale, o.width*scene.gameScale, o.height*scene.gameScale, 0x00ff00, 0.7)
            healArea.setStrokeStyle(4, 0x00cc33)
            healArea.setOrigin(0).setAlpha(0.4)

            scene.tweens.add({
                targets: healArea,
                alpha: 0.2,
                duration: 1000,
                ease: 'Quad.easeOut',
                yoyo: true,
                repeat: -1
            })

            const body = scene.world.createKinematicBody(new p.Vec2((o.x+o.width/2)/32, (o.y+o.height/2)/32))
            body.createFixture({
                shape: new p.Box(o.width/2/32, o.height/2/32),
                isSensor: true
            })
            body.setUserData(healArea)

            this.healAreas.push(body)
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
            const object = v.getUserData() as Phaser.GameObjects.GameObject
            if(object) object.destroy()

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
            const object = v.getUserData() as Phaser.GameObjects.GameObject
            if(object) object.destroy()

            this.scene.world.destroyBody(v)
        })
        this.entrances = []

        this.healAreas.forEach(v => {
            const object = v.getUserData() as Phaser.GameObjects.GameObject
            if(object) object.destroy()

            this.scene.world.destroyBody(v)
        })
        this.healAreas = []

        this.npcs.forEach(v => {
            v.destroy()
        })
        this.npcs = []
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