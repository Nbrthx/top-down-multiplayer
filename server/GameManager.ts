import { Server } from "socket.io";
import { Game } from "./GameWorld";
import { Item } from "./server";

export interface InputData {
    dir: { x: number, y: number }
    attackDir: { x: number, y: number }
}

interface TradeSession {
    player1: string
    player2: string
    item1: Item[]
    item2: Item[]
    state: boolean
    timestamp: number
}

export class GameManager{
    
    worlds: Game[]
    io: Server;

    playerMap: Map<string, string>;
    playerChangeWorld: Map<string, string>
    duelRequest: Map<string, string>
    tradeRequest: Map<string, string>

    tradeSession: TradeSession[]

    constructor(io: Server) {
        this.worlds = [];
        this.io = io
        
        this.playerMap = new Map();
        this.playerChangeWorld = new Map()
        this.duelRequest = new Map()
        this.tradeRequest = new Map()

        this.tradeSession = []

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