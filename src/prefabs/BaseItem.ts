import { Game } from "../scenes/Game";
import p from 'planck'
import { BaseItemConfig } from "./ItemInstance";

export abstract class BaseItem extends Phaser.GameObjects.Container {

    scene: Game;
    parentBody: p.Body;

    sprite: Phaser.GameObjects.Sprite;
    
    timestamp: number
    cooldown: number
    config: BaseItemConfig
    canMove: boolean = true;
    attackDelay: number = 0;

    constructor(scene: Game, parentBody: p.Body) {
        super(scene, 0, 16);

        this.scene = scene;
        this.parentBody = parentBody;
    }

    abstract use(x: number, y: number): void;

    canUse(): boolean {
        return true;
    }

    destroy(fromScene?: boolean): void {
        super.destroy(fromScene);
    }
}