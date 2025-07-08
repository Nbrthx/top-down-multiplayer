import * as p from 'planck'
import { Game } from "../GameWorld";
import { BaseItem } from "./BaseItem";
import { MeleeWeapon, Melee } from "./items/MeleeWeapon";
import { RangeWeapon, Range } from "./items/RangeWeapon";
import { Resource } from './items/ResourceItem';

interface MeleeItem {
    id: string
    type: 'melee'
    config: Melee
}

interface RangeItem {
    id: string
    type: 'range'
    config: Range
}

interface ResourceItem {
    id: string
    type: 'resource'
    config: Resource
}

type Item = MeleeItem | RangeItem | ResourceItem

export type BaseItemConfig = Melee | Range | Resource;

export const itemList: Item[] = [
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
            force: 6,
            forceDelay: 0,
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
            damage: 4.5,
            knockback: 18,
            force: 10,
            forceDelay: 0,
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
            range: 6,
            cooldown: 1400,
            attackDelay: 200,
            damage: 5,
            knockback: 20,
            force: -8,
            forceDelay: 100,
            canMove: false,
            isPenetrating: false
        }
    },
    {
        id: 'dagger',
        type: 'melee',
        config: {
            texture: 'dagger',
            offsetMultipler: 0.2,
            hitboxSize: { width: 1.4, height: 0.4 },
            hitboxOffsetMultipler: 0.4,
            cooldown: 3000,
            attackDelay: 300,
            damage: 8,
            knockback: 8,
            force: 24,
            forceDelay: 200,
            canMove: false
        }
    },
    {
        id: 'blue-knife',
        type: 'range',
        config: {
            texture: 'throw',
            projectileTexture: 'blue-knife',
            offsetMultipler: 0.7,
            hitboxSize: { width: 0.2, height: 0.1 },
            speed: 10,
            range: 8,
            cooldown: 400,
            attackDelay: 300,
            damage: 1.6,
            knockback: 10,
            force: -12,
            forceDelay: 200,
            canMove: true,
            isPenetrating: true
        }
    },
    {
        id: 'wood',
        type: 'resource',
        config: {
            isUsable: false,
            cooldown: 1000
        }
    }
]

export class ItemInstance{

    scene: Game;
    parentBody: p.Body;
    itemInstance: BaseItem

    constructor(scene: Game, parentBody: p.Body, itemId?: string){
        this.scene = scene;
        this.parentBody = parentBody;

        const defaultConfig = itemList[0].config as Melee;
        const item = itemList.find(item => item.id === itemId || '');

        if(item){
            if(item.type === 'melee'){
                this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, item.config);
            }
            else if(item.type === 'range'){
                this.itemInstance = new RangeWeapon(this.scene, this.parentBody, item.config);
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