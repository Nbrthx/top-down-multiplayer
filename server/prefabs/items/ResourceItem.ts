import { Game } from "../../GameWorld";
import { BaseItem } from "../BaseItem";
import * as p from "planck";

export interface Resource {
    isUsable: boolean;
    cooldown: number;
}

export class ResourceItem extends BaseItem {

    config: Resource;
    quantity: number = 1;

    constructor(scene: Game, parentBody: p.Body, config: Resource) {
        super(scene, parentBody);

        this.config = config
        this.timestamp = 0;
        this.cooldown = 1000;
    }

    use(x: number, y: number) {
        if (!this.config.isUsable) return;
        if(!this.canUse()) return;

        this.timestamp = Date.now();

        x; y;
        
        if(this.quantity > 0) this.quantity--;
    }
}