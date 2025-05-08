import { Scene } from 'phaser';
import p from 'planck';
import { Player } from '../prefabs/Player';
import GameUI from './GameUI';
import { Socket } from 'socket.io-client'
import { ContactEvents } from '../components/ContactEvents';
import { createDebugGraphics } from '../components/PhysicsDebug';
import { MapSetup } from '../components/MapSetup';

interface OutputData{
    id: string,
    worldId: string,
    pos: { x: number, y: number },
    attackDir: { x: number, y: number },
    health: number
}

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

    player: Player;
    others: Player[];
    otherBodys: p.Body[];

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

        this.mapSetup = new MapSetup(this, 'test')

        this.others = []

        this.accumulator = 0
        this.previousTime = performance.now()
        
        if(this.socket.id) this.connectionHandler()
        else this.socket.on('connect', () => {
            this.connectionHandler()
        })
    }

    update(currentTime: number) {
        const frameTime = (currentTime - this.previousTime) / 1000; // in seconds
        this.previousTime = currentTime;
        this.accumulator += frameTime * 3;
        while (this.accumulator >= 1/20) {
            this.world.step(1/20);
            this.accumulator -= 1/20;

            if(this.player){
                this.handleInput()
            }

            if(this.isDebug) createDebugGraphics(this, this.debugGraphics)
        }
    }

    connectionHandler(){
        this.player = new Player(this, 700, 800, this.socket.id as string)
        this.camera.startFollow(this.player, true, 0.1, 0.1)

        this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
            let x = _pointer.worldX-this.player.x
            let y = _pointer.worldY-this.player.y

            const dir = new p.Vec2(x, y)
            dir.normalize()

            this.player.attackDir = dir
        })

        this.socket.emit('joinGame', 'world1')

        this.socket.on('joinGame', (ids: string[]) => {
            ids.forEach(id => {
                if(id == this.socket.id) return
                console.log(id)

                const other = new Player(this, 700, 800, id)
                this.others.push(other)
                this.otherBodys.push(other.pBody)
            })
        })

        this.socket.on('playerJoined', (id: string) => {
            this.others.push(new Player(this, 700, 800, id))
        })

        this.socket.on('playerLeft', (id: string) => {
            const existPlayer = this.others.find(other => other.id == id)

            if(!existPlayer) return

            this.others.splice(this.others.indexOf(existPlayer), 1)
            this.otherBodys.splice(this.otherBodys.indexOf(existPlayer.pBody), 1)
            existPlayer.destroy()
        })

        this.socket.on('output', (data: OutputData[]) => {
            const playerData = data.find(v => v.id == this.player.id)
            if(playerData){
                const targetPosition = new p.Vec2(playerData.pos.x, playerData.pos.y)
                const currentPosition = this.player.pBody.getPosition()
                this.player.pBody.setPosition(currentPosition.add(targetPosition.sub(currentPosition).mul(0.2)))

                this.player.health = playerData.health
                if(this.player.health <= 0) this.scene.start('GameOver')
            }
            this.others.forEach(other => {
                const otherData = data.find(v => v.id == other.id)
                if(otherData){
                    const targetPosition = new p.Vec2(otherData.pos.x, otherData.pos.y)
                    const currentPosition = other.pBody.getPosition()

                    const normalized = targetPosition.clone().sub(currentPosition).add(new p.Vec2())

                    if(normalized.length() > 0.1) other.pBody.setLinearVelocity(normalized)
                    else other.pBody.setLinearVelocity(new p.Vec2(0, 0))
                
                    normalized.normalize()

                    other.pBody.setPosition(currentPosition.add(targetPosition.sub(currentPosition).mul(0.2)))
                    other.attackDir = new p.Vec2(otherData.attackDir.x, otherData.attackDir.y)
                    
                    other.health = otherData.health
                    if(other.health <= 0){
                        this.others.splice(this.others.indexOf(other), 1)
                        other.destroy()
                    }
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

        if(vel.length() > 0 || this.player.attackDir.length() > 0){
            this.socket.emit('playerInput', 'world1', {
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
