import { Player } from "./Player";
import { Item } from "../server";
import { itemList } from "./ItemInstance";

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

    getItem(id: string){
        return this.items.find(item => item.id === id)
    }

    addItem(id: string, quantity: number): boolean {
        const itemData = itemList.find(item => item.id === id)
        if(!itemData) return false

        const existItem = this.getItem(id)
        if(existItem && existItem.tag == 'resource'){
            // @ts-ignore
            existItem.quantity += quantity

            this.parent.questInProgress?.addProgress('collect', id, quantity)

            const io = this.parent.scene.gameManager.io
            io.to(this.parent.uid).emit('updateInventory', this.items)
            io.to(this.parent.scene.id).emit('otherUpdateInventory', this.parent.uid, this.items)

            return true
        }
        for(let i = 0; i < 25; i++){
            const item = this.items[i]
            if(!item || item.id == ''){

                if(itemData.type == 'resource'){
                    this.items[i] = { id: id, tag: 'resource', quantity: quantity, timestamp: Date.now() }
                }
                else{
                    this.items[i] = { id: id, tag: 'weapon', timestamp: Date.now() }
                }

                if(i == this.activeIndex) this.parent.equipItem(this.activeIndex)

                this.parent.questInProgress?.addProgress('collect', id, quantity)

                const io = this.parent.scene.gameManager.io
                io.to(this.parent.uid).emit('updateInventory', this.items)
                io.to(this.parent.scene.id).emit('otherUpdateInventory', this.parent.uid, this.items)

                return true
            }
        }
        return false
    }

    removeItem(index: number, quantity: number): boolean {
        if(index >= 25) return false
        if(this.items[index] === undefined) return false

        const tag = this.items[index].tag

        if(tag == 'weapon'){
            this.items[index] = {
                id: '',
                tag: null,
                timestamp: Date.now()
            }
        }
        else if(tag == 'resource'){
            // @ts-ignore
            if(this.items[index].quantity > quantity){
                // @ts-ignore
                this.items[index].quantity -= quantity
            }
            // @ts-ignore
            else if(this.items[index].quantity == quantity){
                this.items[index] = {
                    id: '',
                    tag: null,
                    timestamp: Date.now()
                }
            }
            else return false
        }

        if(index == this.activeIndex) this.parent.equipItem(this.activeIndex)
            
        const io = this.parent.scene.gameManager.io
        io.to(this.parent.uid).emit('updateInventory', this.items)
        io.to(this.parent.scene.id).emit('otherUpdateInventory', this.parent.uid, this.items)

        return true
    }

    removeItemById(id: string, quantity: number): boolean {
        for(let i = 0; i < 25; i++){
            if(this.items[i] && this.items[i].id == id){
                return this.removeItem(i, quantity)
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

        this.parent.equipItem(this.activeIndex)

        this.refreshTimestamp(false)
    }

    updateInventory(inventory: (Item | undefined | null)[]){
        inventory.forEach((v, i) => {
            if(v) this.items[i] = v
        })

        this.parent.equipItem(this.activeIndex)
    }

    setActiveIndex(index: number){
        if(index >= 5) index = 0
        this.activeIndex = index

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
}