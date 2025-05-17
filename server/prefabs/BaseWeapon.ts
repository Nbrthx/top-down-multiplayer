import { Game } from "../GameWorld";
import p from 'planck'

export abstract class BaseWeapon {

    scene: Game;
    parentBody: p.Body;
    
    timestamp: number
    cooldown: number
    config: any

    constructor(scene: Game, parentBody: p.Body) {
        this.scene = scene;
        this.parentBody = parentBody;
    }

    abstract attack(x: number, y: number): void;

    canAttack(): boolean {
        return this.timestamp+this.cooldown < Date.now();
    }

    destroy(): void {
        this.scene.contactEvents.destroyEventByBody(this.parentBody);
    }
}