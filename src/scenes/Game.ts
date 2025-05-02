import { Scene, Tilemaps } from 'phaser';
import p from 'planck';
import { Player } from '../prefabs/Player';
import GameUI from './GameUI';
import { Socket } from 'socket.io-client'

export class Game extends Scene{

    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    msg_text : Phaser.GameObjects.Text;
    socket: Socket
    UI: GameUI

    world: p.World
    gameScale = 4;
    player: Player;
    others: Player[];

    debugGraphics: Phaser.GameObjects.Graphics
    accumulator: number;
    previousTime: number;

    constructor (){
        super('Game');
    }

    create (){
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.world = new p.World()

        this.debugGraphics = this.add.graphics().setDepth(100000000000000)

        const map = this.add.tilemap('test')
        const tileset = map.addTilesetImage('tilemaps', 'tilemaps') as Tilemaps.Tileset
        const waterLayer = map.createLayer('water', tileset, 0, 0) as Tilemaps.TilemapLayer
        const groundLayer = map.createLayer('ground', tileset, 0, 0) as Tilemaps.TilemapLayer
        const grassLayer = map.createLayer('grass', tileset, 0, 0) as Tilemaps.TilemapLayer
        const otherLayer = map.createLayer('other', tileset, 0, 0) as Tilemaps.TilemapLayer

        [waterLayer, groundLayer, grassLayer, otherLayer].forEach(v => {
            v.setScale(4)
        })

        this.UI = (this.scene.get('GameUI') || this.scene.add('GameUI', new GameUI(), true)) as GameUI
        this.socket = this.UI.socket

        this.others = []

        this.socket.on('connect', () => {
            this.player = new Player(this, 700, 800, this.socket.id as string)
            this.camera.startFollow(this.player, true, 0.1, 0.1)

            this.socket.emit('joinGame', 'world1')
        })

        this.camera.setBounds(0, 0, map.widthInPixels*this.gameScale, map.heightInPixels*this.gameScale)

        this.accumulator = 0
        this.previousTime = performance.now()

        this.createBounds(map.width, map.height)

        this.eventHandler()
    }

    update(currentTime: number) {
        const frameTime = (currentTime - this.previousTime) / 1000; // in seconds
        this.previousTime = currentTime;
        this.accumulator += frameTime * 3;
        while (this.accumulator >= 1/20) {
            this.world.step(1/20);
            this.accumulator -= 1/20;

            if(this.player){
                this.player.update()
                this.handleInput()
            }

            this.createDebugGraphics()
        }
    }

    eventHandler(){
        this.socket.on('joinGame', (ids: string[]) => {
            ids.forEach(id => {
                if(id == this.socket.id) return
                console.log(id)
                this.others.push(new Player(this, 700, 800, id))
            })
        })

        this.socket.on('playerJoined', (id: string) => {
            this.others.push(new Player(this, 700, 800, id))
        })

        this.socket.on('playerLeft', (id: string) => {
            const existPlayer = this.others.find(other => other.id == id)

            if(!existPlayer) return

            this.others.splice(this.others.indexOf(existPlayer), 1)
            existPlayer.destroy()
        })

        this.socket.on('output', (data: { id: string, worldId: string, pos: { x: number, y: number } }[]) => {
            const playerData = data.find(v => v.id == this.player.id)
            if(playerData){
                const targetPosition = new p.Vec2(playerData.pos.x, playerData.pos.y)
                const currentPosition = this.player.pBody.getPosition()
                this.player.pBody.setPosition(currentPosition.add(targetPosition.sub(currentPosition).mul(0.1)))
                // this.player.pBody.setPosition(new p.Vec2(playerData.pos.x as number, playerData.pos.y as number))
            }
            this.others.forEach(other => {
                const otherData = data.find(v => v.id == other.id)
                if(otherData){
                    const targetPosition = new p.Vec2(otherData.pos.x, otherData.pos.y)
                    const currentPosition = other.pBody.getPosition()

                    const normalized = targetPosition.clone().sub(currentPosition).add(new p.Vec2(0, 0.1))

                    if(normalized.length() > 0.1) other.pBody.setLinearVelocity(normalized)
                    else other.pBody.setLinearVelocity(new p.Vec2(0, 0))
                
                    normalized.normalize()

                    other.pBody.setPosition(currentPosition.add(targetPosition.sub(currentPosition).mul(0.1)))
                    // other.pBody.setPosition(new p.Vec2(otherData.pos.x as number, otherData.pos.y as number))
                }
            })
        })
    }

    handleInput(){
        const vel = new p.Vec2()

        const input = {
            up: this.input.keyboard?.addKey('W')?.isDown,
            down: this.input.keyboard?.addKey('S')?.isDown,
            left: this.input.keyboard?.addKey('A')?.isDown,
            right: this.input.keyboard?.addKey('D')?.isDown
        }
    
        if(input.up){
            vel.y = -1;
        }
        if(input.down){
            vel.y = 1;
        }
        if(input.left){
            vel.x = -1;
        }
        if(input.right){
            vel.x = 1;
        }
        
        vel.normalize();

        vel.mul(this.player.speed);
        this.player.pBody.setLinearVelocity(vel)

        if(vel.length() > 0){
            this.socket.emit('playerInput', 'world1', { dir: { x: vel.x, y: vel.y } })
        }

        this.player.update()

        this.others.forEach(other => {
            other.update()
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
            const body = this.world.createBody(wall.pos);
            body.createFixture(new p.Box(wall.size.x / 2, wall.size.y / 2));
        });
    };

    createDebugGraphics() {
        this.debugGraphics.clear()

        for (let body = this.world.getBodyList(); body; body = body.getNext()) {
            const position = body.getPosition();
            const angle = body.getAngle();

            let color: number = 0x999999
            switch(body.getType()){
                case p.Body.KINEMATIC: color = 0xffff00; break;
                case p.Body.DYNAMIC: color = 0x00ffff; break;
                case p.Body.STATIC: color = 0x0000ff; 
            }
            color = body.isActive() ? color : 0x999999

            this.debugGraphics.lineStyle(2, color, 1);
            for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
                const shape = fixture.getShape();

                if (shape instanceof p.Box) {
                    const vertices = shape.m_vertices

                    const transformedVertices = vertices.map(v => {
                        return v.clone().add(shape.m_centroid);
                    }).map(v => {
                        const rotatedX = v.x * Math.cos(angle) - v.y * Math.sin(angle);
                        const rotatedY = v.x * Math.sin(angle) + v.y * Math.cos(angle);
                        return new p.Vec2(rotatedX, rotatedY).add(position).sub(shape.m_centroid);
                    });

                    this.debugGraphics.beginPath()
                    this.debugGraphics.moveTo(transformedVertices[0].x * this.gameScale * 32, transformedVertices[0].y * this.gameScale * 32);
                    for (let i = 1; i < transformedVertices.length; i++) {
                        this.debugGraphics.lineTo(transformedVertices[i].x * this.gameScale * 32, transformedVertices[i].y * this.gameScale * 32);
                    }
                    this.debugGraphics.closePath();
                    this.debugGraphics.strokePath();
                }
                if(shape instanceof p.Circle){
                    const center = shape.m_p.clone().add(position);
                    this.debugGraphics.strokeCircle(center.x * this.gameScale * 32, center.y * this.gameScale * 16, shape.m_radius * this.gameScale * 32)
                }
            }
        }
    }
}
