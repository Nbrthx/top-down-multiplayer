import { Game } from "../scenes/Game";
import p from 'planck'

export abstract class BaseWeapon extends Phaser.GameObjects.Container {

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

    abstract attack(x: number, y: number): void;

    canAttack(): boolean {
        return this.timestamp+this.cooldown < Date.now();
    }

    destroy(fromScene?: boolean): void {
        this.scene.contactEvents.destroyEventByBody(this.parentBody);
        super.destroy(fromScene);
    }
}