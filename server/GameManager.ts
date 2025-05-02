import { Server } from "socket.io";
import { Game } from "./GameWorld";

export class GameManager{
    
    worlds: Game[]
    playerMap: Map<string, string>;
    io: Server

    constructor(io: Server) {
        this.worlds = [];
        this.playerMap = new Map();
        this.io = io

        this.createWorld('world1')

        setInterval(() => {
            this.update();
        }, 1000 / 60);
    }

    public createWorld(worldId: string){
        this.worlds.push(new Game(this, worldId))
    }

    public getWorld(worldId: string){
        return this.worlds.find(world => world.id == worldId)
    }

    public handleInput(id: string, worldId: string, input: { dir: { x: number, y: number } }){
        if(!this.getWorld(worldId)?.players.find(player => player.id == id)) return

        if(!this.getWorld(worldId)?.inputData.has(id)) this.getWorld(worldId)?.inputData.set(id, [])
        this.getWorld(worldId)?.inputData.get(id)?.push(input)
    }

    update() {
        this.worlds.forEach((world) => {
            world.update(1/20);

            const gameState = world.players.map(v => {
                return {
                    id: v.id,
                    worldId: world.id,
                    pos: v.pBody.getPosition()
                }
            })

            this.io.emit('output', gameState)
        });
    }
    
}