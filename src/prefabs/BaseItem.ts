import { Game } from "../scenes/Game";
import p from 'planck'

export abstract class BaseItem extends Phaser.GameObjects.Container {

    scene: Game;
    parentBody: p.Body;
    
    timestamp: number
    cooldown: number
    config: any

    constructor(scene: Game, parentBody: p.Body) {
        super(scene, 0, 16);

        this.scene = scene;
        this.parentBody = parentBody;
    }

    abstract use(x: number, y: number): void;

    canUse(): boolean {
        return this.timestamp+this.cooldown < Date.now()-50;
    }

    destroy(fromScene?: boolean): void {
        super.destroy(fromScene);
    }
}