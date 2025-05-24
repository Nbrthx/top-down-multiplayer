import { Server } from "socket.io";
import { Game } from "./GameWorld";

export interface InputData {
    dir: { x: number, y: number }
    attackDir: { x: number, y: number }
}

export class GameManager{
    
    worlds: Game[]
    playerMap: Map<string, string>;
    io: Server

    constructor(io: Server) {
        this.worlds = [];
        this.playerMap = new Map();
        this.io = io

        this.createWorld('test')
        this.createWorld('test2')

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

    public getPlayerWorld(playerId: string){
        return this.getWorld(this.playerMap.get(playerId) || '')
    }

    public handleInput(id: string, input: InputData){
        const world = this.getPlayerWorld(id)

        if(!world) return
        if(!world.players.find(player => player.id == id)) return

        if(!world.inputData.has(id)) world.inputData.set(id, [])
        world.inputData.get(id)?.push(input)
    }

    update() {
        this.worlds.forEach((world) => {
            world.update(1/20);
        });
    }
    
}