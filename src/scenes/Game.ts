import { Scene, Tilemaps } from 'phaser';
import p from 'planck';
import { Player } from '../prefabs/Player';

export class Game extends Scene{

    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    msg_text : Phaser.GameObjects.Text;

    world: p.World
    gameScale = 4;
    player: Player;

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

        this.player = new Player(this, 700, 800)

        this.camera.startFollow(this.player, true, 0.1, 0.1)
        this.camera.setBounds(0, 0, map.widthInPixels*this.gameScale, map.heightInPixels*this.gameScale)

        this.accumulator = 0
        this.previousTime = performance.now()

        this.createBounds(map.width, map.height)
    }

    update(currentTime: number) {
        const frameTime = (currentTime - this.previousTime) / 1000; // in seconds
        this.previousTime = currentTime;
        this.accumulator += frameTime * 3;
        while (this.accumulator >= 1/20) {
            this.world.step(1/20);
            this.accumulator -= 1/20;

            this.player.update()

            this.handleInput()

            this.createDebugGraphics()
        }
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

        this.player.update()
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

    // For debugging hitbox
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
