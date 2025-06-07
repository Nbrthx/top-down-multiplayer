import * as p from 'planck'
import { Game } from "../GameWorld";
import { BaseItem } from "./BaseItem";
import { MeleeWeapon } from "./items/MeleeWeapon";
import { RangeWeapon } from "./items/RangeWeapon";

export const itemList: {
    id: string
    type: string
    config: any
}[] = [
    {
        id: 'punch',
        type: 'melee',
        config: {
            texture: 'punch',
            offsetMultipler: 1,
            hitboxSize: { width: 0.7, height: 0.2 },
            hitboxOffsetMultipler: 1.1,
            cooldown: 500,
            attackDelay: 100,
            damage: 2,
            knockback: 15,
            force: 6
        }
    },
    {
        id: 'sword',
        type: 'melee',
        config: {
            texture: 'sword',
            offsetMultipler: 0.5,
            hitboxSize: { width: 0.6, height: 0.7 },
            hitboxOffsetMultipler: 1.2,
            cooldown: 800,
            attackDelay: 200,
            damage: 5,
            knockback: 19,
            force: 10
        }
    },
    {
        id: 'bow',
        type: 'range',
        config: {
            texture: 'bow',
            projectileTexture: 'arrow',
            offsetMultipler: 0.8,
            hitboxSize: { width: 0.4, height: 0.1 },
            speed: 30,
            range: 5,
            cooldown: 1200,
            attackDelay: 200,
            damage: 5,
            knockback: 18,
            force: -8
        }
    }
]

export class ItemInstance{

    scene: Game;
    parentBody: p.Body;
    itemInstance: BaseItem

    constructor(scene: Game, parentBody: p.Body, weaponId?: string){
        this.scene = scene;
        this.parentBody = parentBody;

        const defaultWeapon = itemList[0];
        const weapon = itemList.find(weapon => weapon.id === weaponId || '');

        if(weapon){
            if(weapon.type === 'melee'){
                this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, weapon.config);
            }
            else if(weapon.type === 'range'){
                this.itemInstance = new RangeWeapon(this.scene, this.parentBody, weapon.config);
            }
            else{
                this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, defaultWeapon.config);
            }
        }
        else{
            this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, defaultWeapon.config);
        }
    }
}