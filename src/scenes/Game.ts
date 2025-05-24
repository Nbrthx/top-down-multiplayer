import { Scene } from 'phaser';
import p from 'planck';
import { Player } from '../prefabs/Player';
import GameUI from './GameUI';
import { Socket } from 'socket.io-client'
import { ContactEvents } from '../components/ContactEvents';
import { createDebugGraphics } from '../components/PhysicsDebug';
import { MapSetup } from '../components/MapSetup';
import { Enemy } from '../prefabs/Enemy';
import { NetworkHandler } from '../components/NetworkHandler';
import { DroppedItem } from '../prefabs/DroppedItem';

export class Game extends Scene{

    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    msg_text : Phaser.GameObjects.Text;
    socket: Socket
    UI: GameUI

    world: p.World
    gameScale = 4;
    contactEvents: ContactEvents
    mapSetup: MapSetup
    networkHandler: NetworkHandler

    player: Player;
    others: Player[];
    enemies: Enemy[]
    droppedItems: DroppedItem[];

    debugGraphics: Phaser.GameObjects.Graphics
    accumulator: number;
    previousTime: number;

    isDebug: boolean = false

    constructor (){
        super('Game');
    }

    create (){
        this.world = new p.World()
        this.contactEvents = new ContactEvents(this.world)

        this.debugGraphics = this.add.graphics().setDepth(100000000000000)

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.UI = (this.scene.get('GameUI') || this.scene.add('GameUI', new GameUI(), true)) as GameUI
        this.socket = this.UI.socket

        this.enemies = []
        this.droppedItems = []

        this.mapSetup = new MapSetup(this, 'test')

        this.others = []

        this.accumulator = 0
        this.previousTime = performance.now()
        
        if(this.socket.id) this.networkHandler = new NetworkHandler(this)
        else this.socket.on('connect', () => {
            this.networkHandler = new NetworkHandler(this)
        })
    }

    update(currentTime: number) {
        if(!this.networkHandler.isAuthed) return;

        const frameTime = (currentTime - this.previousTime) / 1000; // in seconds
        this.previousTime = currentTime;
        this.accumulator += frameTime * 3;
        while (this.accumulator >= 1/20) {
            this.world.step(1/20);
            this.accumulator -= 1/20;

            if(this.player){
                this.handleInput()
            }

            this.enemies.forEach(v => {
                v.update()
            })

            if(this.isDebug) createDebugGraphics(this, this.debugGraphics)
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

        if(vel.length() > 0 || this.player.attackDir.length() > 0){
            this.socket.emit('playerInput', {
                dir: { x: vel.x, y: vel.y },
                attackDir: { x: this.player.attackDir.x, y: this.player.attackDir.y }
            })
        }

        this.player.update()

        this.others.forEach(other => {
            other.update()
        })
    }
}
