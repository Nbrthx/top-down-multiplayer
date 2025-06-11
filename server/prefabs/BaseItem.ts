import { Game } from "../GameWorld";
import * as p from 'planck'
import { BaseItemConfig } from "./ItemInstance";

export abstract class BaseItem {

    scene: Game;
    parentBody: p.Body;
    
    attackDir: p.Vec2
    timestamp: number
    cooldown: number
    config: BaseItemConfig

    damage: number = 0
    knockback: number = 0
    canMove: boolean = true

    isAttacking: boolean

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