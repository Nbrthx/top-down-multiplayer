import { GameUI } from "../../scenes/GameUI";
import { Inventory, Item } from "../Inventory";

export class TradeUI extends Phaser.GameObjects.Container {

    scene: GameUI
    inventory: Inventory
    otherName: Phaser.GameObjects.Text
    otherUid: string | null

    private leftItemList: Item[] = [];
    private rightItemList: Item[] = [];

    private selectedIndex: number = -1

    private inventoryContainer: Phaser.GameObjects.Container
    private leftImageContainer: Phaser.GameObjects.Container
    private rightImageContainer: Phaser.GameObjects.Container
    private leftContainer: Phaser.GameObjects.Container;
    blackInventoryBg: Phaser.GameObjects.Rectangle;
    inventoryBg: Phaser.GameObjects.Image;

    buttonCancel: Button
    buttonAccept: Button

    popupRange: PopupRange

    constructor(scene: GameUI, x: number, y: number, inventory: Inventory) {
        super(scene, x, y);

        this.scene = scene

        const bg = scene.add.image(0, 0, 'trade').setScale(4)
        this.blackInventoryBg = scene.add.rectangle(0, scene.scale.height/2-y, scene.scale.width, scene.scale.height, 0x000000, 0.6)
        this.inventoryBg = scene.add.image(0, scene.scale.height/2-y, 'clear-inventory').setScale(4)

        this.blackInventoryBg.setInteractive()
        this.blackInventoryBg.on('pointerdown', () => {
            this.toggleInventory(false)
        })

        this.inventory = inventory

        this.inventoryContainer = this.scene.add.container(-320 + 16, -scene.scale.height/2-32)
        this.leftContainer = this.scene.add.container(0, 0)

        this.otherName = this.scene.add.text(48*4, -140, '', {
            fontFamily: 'PixelFont', fontSize: 48,
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0, 0.5);

        this.createButton(-48*4*3, 0, this.leftContainer);
        this.createInventory(this.inventoryContainer, 5, 5);

        this.toggleInventory(false);

        this.leftImageContainer = this.scene.add.container(0, 0);
        this.rightImageContainer = this.scene.add.container(0, 0);

        this.createImage(-48*4*3, 0, this.leftImageContainer);
        this.createImage(48*4, 0, this.rightImageContainer);

        this.buttonCancel = new Button(this.scene, -48*4*2-128, -140, 'Cancel');
        this.buttonAccept = new Button(this.scene, -48*4-64, -140, 'Accept');

        this.popupRange = new PopupRange(scene, 0, scene.scale.height/2-y, inventory);
        
        this.add([
            bg,
            this.leftImageContainer,
            this.rightImageContainer,
            this.leftContainer,
            this.otherName,
            this.buttonCancel,
            this.buttonAccept,
            this.blackInventoryBg,
            this.inventoryBg,
            this.inventoryContainer,
            this.popupRange
        ]);
        scene.add.existing(this);
    }

    private createImage(xStart: number, yPos: number, container: Phaser.GameObjects.Container) {
        container.removeAll(true);

        const itemList = container == this.leftImageContainer ? this.leftItemList : this.rightItemList

        for (let i = 0; i < 4; i++) {
            const item = itemList[i]
            if(!item || item.id == '') continue

            const x = xStart + i * (28*4 + 4*4);
            const image = this.scene.add.image(x, yPos, 'icon-'+item.id);         
            image.setScale(4);

            container.add(image);

            if(item.tag == 'resource'){
                const itemCount = this.scene.add.text(x + 32, yPos + 32, 'x'+item.quantity, {
                    fontFamily: 'PixelFont', fontSize: 24, color: '#ffffff',
                    stroke: '#000000', strokeThickness: 4
                }).setOrigin(0.5, 0.5).setDepth(10000000)

                container.add(itemCount)
            }
        }
    }

    /**
     * Helper method untuk membuat slot.
     * @param xStart Posisi X untuk kolom slot.
     * @param yPos Posisi Y awal untuk slot pertama.
     * @param slotArray Array untuk menyimpan objek slot yang dibuat.
     */
    private createButton(xStart: number, yPos: number, container: Phaser.GameObjects.Container) {
        for (let i = 0; i < 4; i++) {
            const x = xStart + i * (28*4 + 4*4);
            const btn = this.scene.add.rectangle(x, yPos, 28*4, 28*4, 0x000000, 0.4);
            this.scene.tweens.add({
                targets: btn,
                alpha: 0,
                duration: 500,
                yoyo: true,
                loop: -1
            })
            btn.setInteractive();
            btn.on('pointerdown', () => {
                this.selectedIndex = parseInt(i.toString())
                this.toggleInventory(true)
            })

            container.add(btn);
        }
    }

    createInventory(container: Phaser.GameObjects.Container, row: number, col: number) {
        container.removeAll(true);

        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                const x = j * 128;
                const y = i * 128;

                const item = this.inventory.items[i*5 + j];

                const itemIcon = !item || item.id == '' ? this.scene.add.rectangle(x + 48, y + 48, 24, 24) : this.scene.add.image(x + 48, y + 48, 'icon-'+item.id);
                itemIcon.setScale(4).setDepth(100);
                itemIcon.setInteractive();

                container.add(itemIcon);

                if(item.tag == 'resource'){
                    const itemCount = this.scene.add.text(x + 80, y + 80, 'x'+item.quantity, {
                        fontFamily: 'PixelFont', fontSize: 24, color: '#ffffff',
                        stroke: '#000000', strokeThickness: 4
                    }).setOrigin(0.5, 0.5).setDepth(10000000)

                    itemIcon.on('pointerdown', () => {
                        this.popupRange.addResourceItem(this.selectedIndex, i*5+j, item.quantity)
                        this.toggleInventory(false)
                    })

                    container.add(itemCount)
                }
                else{
                    itemIcon.on('pointerdown', () => {
                        this.scene.socket.emit('addTradeItem', this.selectedIndex, i*5+j)
                        this.toggleInventory(false)
                    })
                }
            }
        }
    }

    toggleInventory(visible: boolean){
        this.inventoryContainer.setVisible(visible)
        this.blackInventoryBg.setVisible(visible)
        this.inventoryBg.setVisible(visible)

        if(visible) this.createInventory(this.inventoryContainer, 5, 5)
    }

    startTrade(uid: string, username: string){
        this.otherUid = uid
        
        this.setVisible(true)
        this.otherName.setText(username+' (ready)')
        this.toggleInventory(false)

        this.buttonCancel.on('pointerdown', () => {
            this.scene.socket.emit('tradeDecline')
        })

        this.buttonAccept.setText('Accept')
        this.buttonAccept.setVisible(true)
        this.buttonAccept.on('pointerdown', () => {
            this.scene.socket.emit('dealTrade')
            this.buttonAccept.setVisible(false)
        })
    }

    addTradeItem(selectedIndex: number, id: string, tag: 'weapon' | 'resource' | null, isSelf: boolean, quantity?: number){
        console.log('addTradeItem', selectedIndex, id, tag, isSelf, quantity)

        if(isSelf){
            this.leftItemList[selectedIndex] = {
                id: id,
                tag: tag,
                quantity: quantity || 1,
                timestamp: Date.now()
            }
            this.createImage(-48*4*3, 0, this.leftImageContainer)
        }
        else{
            this.rightItemList[selectedIndex] = {
                id: id,
                tag: tag,
                quantity: quantity || 1,
                timestamp: Date.now()
            }
            this.createImage(48*4, 0, this.rightImageContainer)
        }
        this.buttonAccept.setVisible(true)
    }

    endTrade(){
        this.setVisible(false)
        this.otherUid = null
        this.otherName.setText('')

        this.leftItemList = []
        this.rightItemList = []

        this.leftImageContainer.removeAll(true)
        this.rightImageContainer.removeAll(true)
    }
}

class PopupRange extends Phaser.GameObjects.Container {

    scene: GameUI;
    inventory: Inventory;

    dot: Phaser.GameObjects.Arc;
    addButton: Phaser.GameObjects.Text;
    countText: Phaser.GameObjects.Text;

    constructor(scene: GameUI, x: number, y: number, inventory: Inventory) {
        super(scene, x, y);

        scene.add.existing(this);

        this.scene = scene;
        this.inventory = inventory;
        this.setVisible(false);

        const background = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.6)
        background.setInteractive()
        background.on('pointerdown', () => {
            this.setVisible(false);
            this.dot.setX(-200)
            this.countText.setText('Items Count: 1')
            this.dot.off('drag')
            this.addButton.off('pointerdown');
        })

        const box = scene.add.rectangle(0, 0, 500, 200, 0xbbbbbb)

        const bar = scene.add.rectangle(0, 0, 400, 10, 0x000000);

        this.countText = scene.add.text(0, -60, 'Items Count: 1', {
            fontFamily: 'PixelFont', fontSize: 24, color: '#000000',
        }).setOrigin(0.5, 0.5);

        this.dot = scene.add.arc(-200, 0, 16)
        this.dot.setFillStyle(0xff0000, 1)
        this.dot.setOrigin(0.5, 0.5)
        this.dot.setInteractive({ draggable: true });
        
        this.addButton = scene.add.text(0, 60, 'Add Item', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000',
            backgroundColor: '#ffffff', padding: { x: 40, y: 5 }
        }).setOrigin(0.5, 0.5);

        this.add([
            background,
            box,
            bar,
            this.dot,
            this.countText,
            this.addButton
        ]);
    }

    addResourceItem(selectedIndex: number, index: number, quantity: number) {
        this.setVisible(true);

        this.dot.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
            this.dot.x = dragX;

            const step = 400 / (quantity-1);
            this.dot.x = Math.round((dragX + 200) / step) * step - 200;

            if(this.dot.x < -200) this.dot.x = -200
            if(this.dot.x > 200) this.dot.x = 200
            
            this.countText.setText(`Items Count: ${Math.abs(Math.round((this.dot.x + 200) / 400 * (quantity-1)))+1}`);
        })

        this.addButton.setInteractive();
        this.addButton.on('pointerdown', () => {
            const itemCount = Math.abs(Math.round((this.dot.x + 200) / 400 * (quantity-1)))+1;
            this.scene.socket.emit('addTradeItem', selectedIndex, index, itemCount)

            this.setVisible(false);
            this.dot.setX(-200)
            this.countText.setText('Items Count: 1')
            this.dot.off('drag')
            this.addButton.off('pointerdown');
        });
    }
}

class Button extends Phaser.GameObjects.Container{

    bg: Phaser.GameObjects.NineSlice;
    text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, text: string){
        super(scene, x, y)

        this.bg = scene.add.nineslice(0, 0, 'button-nineslice', 0, 48, 16, 4, 4, 4, 4)
        this.bg.setScale(4)
        this.bg.setInteractive();

        this.text = scene.add.text(0, 0, text, {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000'
        }).setOrigin(0.5, 0.5);

        this.add([this.bg, this.text])
    }

    on(event: string, listener: (...args: any[]) => void){
        if(!this.bg || !this.text) return this;

        this.bg.on(event, (...args: any[]) => {
            this.bg.setTint(0x888888);
            setTimeout(() => {

                listener(...args);

                this.bg.clearTint();
            }, 100);
        });

        return this
    }

    off(event: string | symbol, fn?: Function, context?: any, once?: boolean): this {
        this.bg.off(event, fn, context, once);
        return this
    }

    setText(text: string){
        this.text.setText(text)
    }
}
