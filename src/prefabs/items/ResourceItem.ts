import { Game } from "../../scenes/Game";
import { BaseItem } from "../BaseItem";
import p from "planck";

export interface Resource {
    isUsable: boolean;
    cooldown: 1000;
}

export class ResourceItem extends BaseItem {

    config: Resource;

    constructor(scene: Game, parentBody: p.Body, config: Resource) {
        super(scene, parentBody);

        this.config = config
        this.timestamp = 0;
        this.cooldown = config.cooldown || 1000;
        this.config.cooldown = 1000

        this.sprite = scene.add.sprite(0, 0, 'punch').setVisible(false)
    }

    use(x: number, y: number) {
        // if (!this.config.isUsable) return;
        if (!this.canUse()) return;

        this.timestamp = Date.now();

        x; y;
    }
}