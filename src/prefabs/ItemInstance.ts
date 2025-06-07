import p from 'planck'
import { Game } from "../scenes/Game";
import { BaseItem } from "./BaseItem";
import { MeleeWeapon, Melee } from "./items/MeleeWeapon";
import { RangeWeapon, Range } from "./items/RangeWeapon";

interface MeleeIteme {
    id: string
    type: 'melee'
    config: Melee
}

interface RangeItem {
    id: string
    type: 'range'
    config: Range
}

type ItemEntry = MeleeIteme | RangeItem

export type BaseItemConfig = Melee | Range

export const itemList: ItemEntry[] = [
    {
        id: 'punch',
        type: 'melee',
        config: {
            texture: 'punch',
            offsetMultipler: 1,
            hitboxSize: { width: 0.7, height: 0.2 },
            hitboxOffsetMultipler: 1.1,
            cooldown: 500,
            attackDelay: 100
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
            attackDelay: 200
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
            speed: 8,
            range: 7,
            cooldown: 1200,
            attackDelay: 200
        }
    }
];

export class ItemInstance{

    scene: Game;
    parentBody: p.Body;
    itemInstance: BaseItem

    constructor(scene: Game, parentBody: p.Body, weaponId?: string){
        this.scene = scene;
        this.parentBody = parentBody;

        const defaultConfig = itemList[0].config as Melee;
        const weapon = itemList.find(weapon => weapon.id === weaponId || '');

        if(weapon){
            if(weapon.type === 'melee'){
                this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, weapon.config);
            }
            else if(weapon.type === 'range'){
                this.itemInstance = new RangeWeapon(this.scene, this.parentBody, weapon.config);
            }
            else{
                this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, defaultConfig);
            }
        }
        else{
            this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, defaultConfig);
        }
    }
}