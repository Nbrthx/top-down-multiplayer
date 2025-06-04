import { Game } from "../GameWorld";
import * as p from 'planck'

export abstract class BaseItem {

    scene: Game;
    parentBody: p.Body;
    
    attackDir: p.Vec2
    timestamp: number
    cooldown: number
    config: any

    constructor(scene: Game, parentBody: p.Body) {
        this.scene = scene;
        this.parentBody = parentBody;
        this.attackDir = new p.Vec2()
    }

    abstract use(x: number, y: number): void;

    canUse(): boolean {
        return this.timestamp+this.cooldown < Date.now();
    }

    destroy(): void {}
}