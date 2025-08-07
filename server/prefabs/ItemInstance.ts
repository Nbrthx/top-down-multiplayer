import * as p from 'planck'
import { Game } from "../GameWorld";
import { BaseItem } from "./BaseItem";
import { MeleeWeapon, Melee } from "./items/MeleeWeapon";
import { RangeWeapon, Range } from "./items/RangeWeapon";
import { Resource, ResourceItem as ResourceInstance } from './items/ResourceItem';
import { _itemList } from '../json/.item-list.json';

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

export const itemList = _itemList as Item[]

export type BaseItemConfig = Melee | Range | Resource;

export class ItemInstance{

    scene: Game;
    parentBody: p.Body;
    itemInstance: BaseItem

    constructor(scene: Game, parentBody: p.Body, itemId?: string){
        this.scene = scene;
        this.parentBody = parentBody;

        const defaultConfig = itemList[0].config as Melee;
        const item = itemList.find(item => item.id === itemId?.split(':')[0] || '');

        if(item && itemId){
            if(item.type === 'melee'){
                this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, item.config);
            }
            else if(item.type === 'range'){
                this.itemInstance = new RangeWeapon(this.scene, this.parentBody, item.config);
            }
            else{
                this.itemInstance = new ResourceInstance(this.scene, this.parentBody, item.config, itemId);
            }
        }
        else{
            this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, defaultConfig);
        }
    }
}