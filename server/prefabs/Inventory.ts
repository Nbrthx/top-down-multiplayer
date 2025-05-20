import { Player } from "./Player";

export class Inventory {

    parent: Player;
    items: { id: string; name: string }[];
    activeIndex: number;

    constructor(parent: Player) {
        this.parent = parent;
        this.items = [];
        this.activeIndex = 0
    }

    swapItem(index: number, index2: number) {
        if((index >= 25)) return false
        if((index2 >= 25)) return false

        const temp = this.items[index]
        this.items[index] = this.items[index2]
        this.items[index2] = temp

        this.parent.equipItem(this.items[this.activeIndex]?.id || '')
    }

    updateInventory(inventory: { id: string; name: string }[]){
        inventory.forEach((v, i) => {
            this.items[i] = v
        })

        this.parent.equipItem(this.items[this.activeIndex]?.id || '')
    }

    setActiveIndex(index: number){
        if(index >= 5) index = 0
        this.activeIndex = index

        this.parent.equipItem(this.items[index]?.id || '')
    }
}