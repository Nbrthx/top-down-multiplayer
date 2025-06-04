import { Player } from "./Player";

export interface Item{
    id: string;
    name: string;
    timestamp: number;
}

export class Inventory {

    parent: Player;
    items: Item[];
    activeIndex: number;

    constructor(parent: Player) {
        this.parent = parent;
        this.items = [];
        this.activeIndex = 0

        for(let i = 0; i < 25; i++){
            this.items.push({
                id: '',
                name: '',
                timestamp: 0
            })
        }
    }

    addItem(item: Item) {
        for(let i = 0; i < 25; i++){
            if(this.items[i] === undefined || this.items[i].id == ''){
                this.items[i] = item

                if(i == this.activeIndex) this.parent.equipItem(this.activeIndex)
                this.onInventoryUpdate()
                return true
            }
        }
        return false
    }

    swapItem(index: number, index2: number) {
        if((index >= 25)) return false
        if((index2 >= 25)) return false

        const temp = this.items[index]
        this.items[index] = this.items[index2]
        this.items[index2] = temp

        this.onInventorySwap(index, index2)
        this.parent.equipItem(this.activeIndex)
        return true
    }

    updateInventory(inventory: Item[]){
        inventory.forEach((v, i) => {
            this.items[i] = v
        })

        this.parent.equipItem(this.activeIndex)
        this.onInventoryUpdate()
    }

    setActiveIndex(index: number){
        if(index >= 5) index = 0
        this.activeIndex = index

        this.onSetActiveIndex()
        this.parent.equipItem(index)
    }

    setItemTimestamp(index: number, timestamp: number){
        if(this.items[index] === undefined) return
        
        this.items[index].timestamp = timestamp
    }

    onInventoryUpdate() {}

    onInventorySwap(index: number, index2: number) { index; index2; }

    onSetActiveIndex() {}
}