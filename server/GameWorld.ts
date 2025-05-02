import p from 'planck'
import { Player } from './prefabs/Player'
import { GameManager } from './GameManager'

export class Game{

    id: string
    gameManager: GameManager
    world: p.World
    gameScale = 4

    players: Player[]
    monsters: string[]
    collider: []
    inputData: Map<string, { dir: { x: number, y: number } }[]>

    constructor(gameManager: GameManager, id: string){
        this.gameManager = gameManager
        this.id = id
        this.world = new p.World()

        this.inputData = new Map()

        this.players = []; // { socketId: Player }
        this.monsters = [];
        this.collider = []; // Tempatkan collider di sini
    }

    update(deltaTime: number) {
        // Step physics world (fixed timestep untuk deterministik)
        this.world.step(deltaTime);
        
        // Update entitas
        this.players.forEach(player => {
            const dirs = this.inputData.get(player.id)?.splice(0)
            const dir = new p.Vec2()

            dirs?.forEach(v => {
                const idir = new p.Vec2(v.dir.x, v.dir.y)
                idir.normalize()

                dir.x += idir.x
                dir.y += idir.y
            })

            if(dir) player.pBody.setLinearVelocity(dir)
        });
    }

    addPlayer(id: string){
        const player = new Player(this, 700, 800, id)
        this.players.push(player)

        this.gameManager.playerMap.set(id, this.id);

        console.log('Player '+id+' has added to game')
    }

    removePlayer(id: string){
        const existPlayer = this.players.find(player => player.id == id)

        if(!existPlayer) return

        this.gameManager.playerMap.delete(id);

        this.players.splice(this.players.indexOf(existPlayer), 1)
        existPlayer.destroy()
    }
}