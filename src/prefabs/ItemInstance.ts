import { Game } from "../scenes/Game";
import { MeleeWeapon } from "./items/MeleeWeapon";
import p from 'planck'



export class ItemInstance{

    scene: Game;
    parentBody: p.Body;
    itemList: {
        id: string
        type: string
        config: any
    }[];
    itemInstance: MeleeWeapon

    constructor(scene: Game, parentBody: p.Body, weaponId?: string){
        this.scene = scene;
        this.parentBody = parentBody;

        this.itemList = [
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
                    hitboxSize: { width: 0.6, height: 0.6 },
                    hitboxOffsetMultipler: 1.2,
                    cooldown: 1000,
                    attackDelay: 200
                }
            }
        ]

        const defaultWeapon = this.itemList[0];
        const weapon = this.itemList.find(weapon => weapon.id === weaponId || '');

        if(weapon){
            if(weapon.type === 'melee'){
                this.itemInstance = new MeleeWeapon(this.scene, this.parentBody, weapon.config);
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