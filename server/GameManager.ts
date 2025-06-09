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
        this.createWorld('test2', true)

        setInterval(() => {
            this.update();
        }, 1000 / 60);
    }

    public createWorld(worldId: string, isPvpAllowed: boolean = false){
        this.worlds.push(new Game(this, worldId, isPvpAllowed))
    }

    public getWorld(worldId: string){
        return this.worlds.find(world => world.id == worldId)
    }

    public getPlayerWorld(playerId: string){
        return this.getWorld(this.playerMap.get(playerId) || '')
    }

    public handleInput(uid: string, input: InputData){
        const world = this.getPlayerWorld(uid)

        if(!world) return
        if(!world.players.find(player => player.uid == uid)) return

        if(!world.inputData.has(uid)) world.inputData.set(uid, [])
        world.inputData.get(uid)?.push(input)
    }

    update() {
        this.worlds.forEach((world) => {
            world.update(1/60);
        });
    }
    
}