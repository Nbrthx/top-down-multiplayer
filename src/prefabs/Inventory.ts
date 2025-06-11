import { itemList } from "./ItemInstance";
import { Player } from "./Player";

interface WeaponItem {
    id: string
    tag: 'weapon'
    timestamp: number
}

interface ResourceItem {
    id: string
    tag: 'resource'
    quantity: number
    timestamp: number
}

interface NoItem {
    id: string
    tag: null
    timestamp: number
}

export type Item = WeaponItem | ResourceItem | NoItem

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
                tag: null,
                timestamp: Date.now()
            })
        }
    }

    swapItem(index: number, index2: number) {
        if((index >= 25)) return false
        if((index2 >= 25)) return false

        const temp = this.items[index]
        this.items[index] = this.items[index2]
        this.items[index2] = temp

        this.onInventorySwap(index, index2)
        this.parent.equipItem(this.activeIndex)

        this.refreshTimestamp(false)

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

    refreshTimestamp(isUse: boolean = true){
        for(let i = 0; i < 5; i++){
            const item = this.items[i]
            if(!item) continue
            
            const instanceData = itemList.find(v => v.id === item.id) || itemList[0]
            const cooldown = instanceData.config.cooldown
            if(i == this.activeIndex && isUse) item.timestamp = Date.now()
            else if(Date.now()-item.timestamp > cooldown) item.timestamp = Date.now()-cooldown+500
        }
    }

    onInventoryUpdate() {}

    onInventorySwap(index: number, index2: number) { index; index2; }

    onSetActiveIndex() {}

    onDropItem(index: number, dir: { x: number, y: number }, quantity?: number) { index; dir; quantity; }
}