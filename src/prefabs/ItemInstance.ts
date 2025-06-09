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
            attackDelay: 100,
            canMove: true
        }
    },
    {
        id: 'sword',
        type: 'melee',
        config: {
            texture: 'sword',
            offsetMultipler: 0.5,
            hitboxSize: { width: 0.8, height: 0.7 },
            hitboxOffsetMultipler: 0.9,
            cooldown: 800,
            attackDelay: 200,
            canMove: true
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
            canMove: false
        }
    },
    {
        id: 'dagger',
        type: 'melee',
        config: {
            texture: 'dagger',
            offsetMultipler: 0.2,
            hitboxSize: { width: 1.4, height: 0.3 },
            hitboxOffsetMultipler: 0.4,
            cooldown: 3000,
            attackDelay: 300,
            canMove: false
        }
    },
    {
        id: 'blue-knife',
        type: 'range',
        config: {
            texture: 'throw',
            projectileTexture: 'blue-knife',
            offsetMultipler: 0.9,
            hitboxSize: { width: 0.2, height: 0.1 },
            speed: 20,
            range: 7,
            cooldown: 600,
            attackDelay: 400,
            canMove: true
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