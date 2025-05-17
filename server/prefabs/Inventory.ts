import { Player } from "./Player";

export class Inventory {

    parent: Player;
    items: { id: string; name: string }[];
    hotItems: { id: string; name: string }[];
    activeIndex: number;

    constructor(parent: Player) {
        this.parent = parent;
        this.items = [];
        this.hotItems = [];
        this.activeIndex = 0
    }

    swapItem(index: number, isHotbar: boolean = false, index2: number, isToHotbar: boolean = false) {
        if((isHotbar && index >= 5) || (!isHotbar && index >= 20)) return false
        if((isToHotbar && index2 >= 5) || (!isToHotbar && index2 >= 20)) return false

        const temp = isHotbar ? this.hotItems[index] : this.items[index]

        if(isToHotbar){
            isHotbar ? this.hotItems[index] = this.hotItems[index2] : this.items[index] = this.hotItems[index2]
            this.hotItems[index2] = temp
        }
        else{
            isHotbar ? this.hotItems[index] = this.items[index2] : this.items[index] = this.items[index2]
            this.items[index2] = temp
        }

        this.parent.equipItem(this.hotItems[this.activeIndex]?.id || '')
    }

    updateInventory(inventory: {
        items: { id: string; name: string }[],
        hotItems: { id: string; name: string }[]
    }){
        inventory.items.forEach((v, i) => {
            this.items[i] = v
        })
        inventory.hotItems.forEach((v, i) => {
            this.hotItems[i] = v
        })

        this.parent.equipItem(this.hotItems[this.activeIndex]?.id || '')
    }

    setActiveIndex(index: number){
        if(index >= 5) index = 0
        this.activeIndex = index

        this.parent.equipItem(this.hotItems[index]?.id || '')
    }
}