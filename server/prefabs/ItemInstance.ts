import { Game } from "../GameWorld";
import { MeleeWeapon } from "./items/MeleeWeapon";
import * as p from 'planck'



export class ItemInstance{

    scene: Game;
    parentBody: p.Body;
    weaponList: {
        id: string
        type: string
        config: any
    }[];
    weaponInstance: MeleeWeapon

    constructor(scene: Game, parentBody: p.Body, weaponId?: string){
        this.scene = scene;
        this.parentBody = parentBody;

        this.weaponList = [
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
                    hitboxSize: { width: 0.5, height: 0.4 },
                    hitboxOffsetMultipler: 0.8,
                    cooldown: 600,
                    attackDelay: 200
                }
            }
        ]

        const defaultWeapon = this.weaponList[0];
        const weapon = this.weaponList.find(weapon => weapon.id === weaponId || '');

        if(weapon){
            if(weapon.type === 'melee'){
                this.weaponInstance = new MeleeWeapon(this.scene, this.parentBody, weapon.config);
            }
            else{
                this.weaponInstance = new MeleeWeapon(this.scene, this.parentBody, defaultWeapon.config);
            }
        }
        else{
            this.weaponInstance = new MeleeWeapon(this.scene, this.parentBody, defaultWeapon.config);
        }
    }
}