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

    addItem(item: { id: string; name: string }) {
        for(let i = 0; i < 25; i++){
            if(this.items[i] === undefined){
                this.items[i] = item

                if(i == this.activeIndex) this.parent.equipItem(this.items[this.activeIndex]?.id || '')

                const io = this.parent.scene.gameManager.io
                io.to(this.parent.id).emit('updateInventory', this.items)
                io.to(this.parent.scene.id).emit('otherUpdateInventory', this.parent.id, this.items)

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

        this.parent.equipItem(this.items[this.activeIndex]?.id || '')
    }

    updateInventory(inventory: ({ id: string; name: string } | undefined | null)[]){
        inventory.forEach((v, i) => {
            if(v) this.items[i] = v
        })

        this.parent.equipItem(this.items[this.activeIndex]?.id || '')
    }

    setActiveIndex(index: number){
        if(index >= 5) index = 0
        this.activeIndex = index

        this.parent.equipItem(this.items[index]?.id || '')
    }
}