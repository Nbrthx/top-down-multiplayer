import p from 'planck'
import { Player } from './prefabs/Player'

export class Game{

    world: p.World
    gameScale = 4

    players: Map<string, Player>
    monsters: Map<string, string>
    collider: []

    constructor(){
        this.world = new p.World()

        this.players = new Map(); // { socketId: Player }
        this.monsters = new Map();
        this.collider = []; // Tempatkan collider di sini
    }

    update(deltaTime) {
        // Step physics world (fixed timestep untuk deterministik)
        this.world.step(deltaTime);
        
        // Update entitas
        this.players.forEach(player => player.update());
    }

}