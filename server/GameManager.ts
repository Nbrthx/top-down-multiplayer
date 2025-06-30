import { Server } from "socket.io";
import { Game } from "./GameWorld";

export interface InputData {
    dir: { x: number, y: number }
    attackDir: { x: number, y: number }
}

export class GameManager{
    
    worlds: Game[]
    playerMap: Map<string, string>;
    io: Server;
    playerChangeWorld: Map<string, string>
    duelRequest: Map<string, string>

    constructor(io: Server) {
        this.worlds = [];
        this.playerMap = new Map();
        this.io = io
        this.playerChangeWorld = new Map()
        this.duelRequest = new Map()

        this.createWorld('map1')
        this.createWorld('map2')
        this.createWorld('map3')
        this.createWorld('map4')
        this.createWorld('map5', true, 4)
        this.createWorld('duel', true)

        setInterval(() => {
            this.update();
        }, 1000 / 60);
    }

    public createWorld(worldId: string, isPvpAllowed: boolean = false, requiredLevel: number = 0){
        this.worlds.push(new Game(this, worldId, isPvpAllowed, requiredLevel))
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