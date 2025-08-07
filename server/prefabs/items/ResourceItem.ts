import { Game } from "../../GameWorld";
import { BaseItem } from "../BaseItem";
import * as p from "planck";
import { Player } from "../Player";

export interface Resource {
    isUsable: boolean;
    cooldown: number;
}

export class ResourceItem extends BaseItem {

    config: Resource;
    id: string

    constructor(scene: Game, parentBody: p.Body, config: Resource, id: string) {
        super(scene, parentBody);

        this.config = config
        this.timestamp = 0;
        this.cooldown = 1000;
        this.config.cooldown = 1000
        this.id = id
    }

    use(x: number, y: number) {
        // if (!this.config.isUsable) return;
        if(!this.canUse()) return;

        this.timestamp = Date.now();

        const parent = this.parentBody.getUserData() as Player

        if(this.id.split(':')[0] == 'wrapped-hair'){
            parent.account.ownedOutfits.push(this.id.split(':')[1].split('-').join('-hair-'))
            parent.inventory.removeItemById(this.id, 1)
        }
        else if(this.id.split(':')[0] == 'wrapped-face'){
            parent.account.ownedOutfits.push(this.id.split(':')[1].split('-').join('-face-'))
            parent.inventory.removeItemById(this.id, 1)
        }
        else if(this.id.split(':')[0] == 'wrapped-body'){
            parent.account.ownedOutfits.push(this.id.split(':')[1].split('-').join('-body-'))
            parent.inventory.removeItemById(this.id, 1)
        }
        else if(this.id.split(':')[0] == 'wrapped-leg'){
            parent.account.ownedOutfits.push(this.id.split(':')[1].split('-').join('-leg-'))
            parent.inventory.removeItemById(this.id, 1)
        }

        this.scene.gameManager.io.sockets.sockets.get(parent.uid)?.emit('changeOwnedOutfits', parent.account.ownedOutfits)

        x; y;
    }
}