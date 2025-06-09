import { Scene } from 'phaser';
import p from 'planck';
import { Player } from '../prefabs/Player';
import { GameUI, isMobile } from './GameUI';
import { Socket } from 'socket.io-client'
import { ContactEvents } from '../components/ContactEvents';
import { createDebugGraphics } from '../components/PhysicsDebug';
import { MapSetup } from '../components/MapSetup';
import { Enemy } from '../prefabs/Enemy'; 
import { NetworkHandler, GameState, OutputData } from '../components/NetworkHandler'; // Diperbarui
import { DroppedItem } from '../prefabs/DroppedItem';
import { SpatialAudio } from '../components/SpatialAudio';
import { Projectile } from '../prefabs/items/RangeWeapon';

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
    spatialAudio: SpatialAudio
    networkHandler: NetworkHandler

    player: Player;
    others: Player[];
    enemies: Enemy[]
    projectiles: Projectile[]
    droppedItems: DroppedItem[];
    realBodyPos: Map<p.Body, { x: number, y: number }>

    attackDir: p.Vec2

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
        
        this.spatialAudio = new SpatialAudio(this)

        this.debugGraphics = this.add.graphics().setDepth(100000000000000)

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.UI = (this.scene.get('GameUI') || this.scene.add('GameUI', new GameUI(), true)) as GameUI
        this.socket = this.UI.socket

        this.attackDir = new p.Vec2()

        this.enemies = []
        this.projectiles = []
        this.droppedItems = []
        this.realBodyPos = new Map()

        this.mapSetup = new MapSetup(this, 'test')

        this.others = []

        this.accumulator = 0
        this.previousTime = performance.now()
        
        if(this.socket.id) this.networkHandler = new NetworkHandler(this)
        else this.socket.on('connect', () => {
            this.networkHandler = new NetworkHandler(this)
        })

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if(!this.player) return;
            if(isMobile()) return

            let x = pointer.worldX-this.player.x
            let y = pointer.worldY-this.player.y-12

            const rad = Math.atan2(y, x)

            this.player.aimAssist.setRotation(rad)

            this.camera.setFollowOffset(-x/this.gameScale/4, -y/this.gameScale/4)
        })

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if(!this.player) return;
            if(isMobile()) return

            let x = pointer.worldX-this.player.x
            let y = pointer.worldY-this.player.y-12

            const dir = new p.Vec2(x, y)
            dir.normalize()

            this.attackDir = dir
        })
    }

    update(currentTime: number) {
        if(!this.networkHandler || !this.networkHandler.isAuthed) return;

        const frameTime = (currentTime - this.previousTime) / 1000; // in seconds
        this.previousTime = currentTime;
        this.accumulator += frameTime;
        while (this.accumulator >= 1/60) {
            this.world.step(1/60);
            this.accumulator -= 1/60;

            if(this.player){
                this.handleInput()
            }

            this.enemies.forEach(v => {
                v && v.update()
            })

            if(this.isDebug) createDebugGraphics(this, this.debugGraphics)
        }
    }

    handleInput(){
        const vel = new p.Vec2()
    
        if(this.UI.keyboardInput.up){
            vel.y = -1;
        }
        if(this.UI.keyboardInput.down){
            vel.y = 1;
        }
        if(this.UI.keyboardInput.left){
            vel.x = -1;
        }
        if(this.UI.keyboardInput.right){
            vel.x = 1;
        }

        if(vel.length() == 0 && this.UI.joystick){
            vel.x = this.UI.joystick.x;
            vel.y = this.UI.joystick.y;
        }

        if(!this.player.itemInstance.config.canMove){
            if(this.player.itemInstance.timestamp+this.player.itemInstance.config.attackDelay > Date.now()){
                vel.mul(0)
                console.log('mul 0')
            }
        }
        
        vel.normalize();

        vel.mul(this.player.speed);
        this.player.pBody.setLinearVelocity(vel)

        if(vel.length() > 0 || this.attackDir.length() > 0){
            this.socket.emit('playerInput', {
                dir: { x: vel.x, y: vel.y },
                attackDir: { x: this.attackDir.x, y: this.attackDir.y }
            })
            this.attackDir = new p.Vec2()
        }

        const pendingUpdates = this.networkHandler.pendingOutput.splice(0); // Ambil semua data dan kosongkan antrian

        if (pendingUpdates.length > 0) {
            const latestPlayers = new Map<string, OutputData & { xp: number }>();
            const latestEnemies = new Map<string, OutputData>();
            
            let finalDroppedItems: GameState['droppedItems'] = [];
            let finalProjectiles: GameState['projectiles'] = [];

            pendingUpdates.forEach(gameState => {
                gameState.players.forEach(playerData => {
                    const existingPlayer = latestPlayers.get(playerData.uid);
                    if (existingPlayer) {
                        if(playerData.attackDir.x != 0 || playerData.attackDir.y != 0){
                            existingPlayer.attackDir = playerData.attackDir;
                        }
                        existingPlayer.timestamp = playerData.timestamp
                        existingPlayer.pos = playerData.pos;
                        existingPlayer.health = playerData.health;
                        existingPlayer.xp = playerData.xp;
                    } else {
                        latestPlayers.set(playerData.uid, playerData);
                    }
                });

                gameState.enemies.forEach(enemyData => {
                    const existingEnemy = latestEnemies.get(enemyData.uid);
                    if (existingEnemy) {
                        if(enemyData.attackDir.x != 0 || enemyData.attackDir.y != 0){
                            existingEnemy.attackDir = enemyData.attackDir;
                        }
                        existingEnemy.timestamp = enemyData.timestamp
                        existingEnemy.pos = enemyData.pos;
                        existingEnemy.health = enemyData.health;
                    } else {
                        latestEnemies.set(enemyData.uid, enemyData);
                    }
                });

                // Ambil daftar droppedItems dan projectiles dari GameState saat ini (yang terakhir akan digunakan)
                finalDroppedItems = gameState.droppedItems;
                finalProjectiles = gameState.projectiles;
            });

            const mergedGameState: GameState = {
                players: Array.from(latestPlayers.values()),
                enemies: Array.from(latestEnemies.values()),
                droppedItems: finalDroppedItems,
                projectiles: finalProjectiles,
            };

            this.networkHandler.update(mergedGameState); // Panggil update sekali dengan data yang sudah digabung
        }

        this.player.update()

        this.others.forEach(other => {
            other.update()
        })
    }
}
