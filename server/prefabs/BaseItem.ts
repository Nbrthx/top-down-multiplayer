import { Game } from "../GameWorld";
import * as p from 'planck'

export abstract class BaseItem {

    scene: Game;
    parentBody: p.Body;
    
    timestamp: number
    cooldown: number
    config: any

    constructor(scene: Game, parentBody: p.Body) {
        this.scene = scene;
        this.parentBody = parentBody;
    }

    abstract use(x: number, y: number): void;

    canUse(): boolean {
        return this.timestamp+this.cooldown < Date.now();
    }

    destroy(): void {
        this.scene.contactEvents.destroyEventByBody(this.parentBody);
    }
}