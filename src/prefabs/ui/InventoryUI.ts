import { GameUI } from "../../scenes/GameUI";
import { Inventory } from "../Inventory";

export class InventoryUI extends Phaser.GameObjects.Container {

    scene: GameUI;
    image: Phaser.GameObjects.Image;
    inventory: Inventory;
    inventoryContainer: Phaser.GameObjects.Container;
    hotbarContainer: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Rectangle;
    popupRange: PopupRange;

    constructor(scene: GameUI, inventory: Inventory) {
        super(scene, scene.scale.width / 2, scene.scale.height / 2);

        this.scene = scene;
        scene.add.existing(this);

        this.inventory = inventory;
        
        this.background = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.6)
        this.background.setInteractive({ dropZone: true }).setName('background')

        this.image = this.scene.add.image(0, 0, 'inventory');
        this.image.setScale(4)
        this.image.setInteractive({ dropZone: true })

        this.inventoryContainer = this.scene.add.container(-320 + 16, -328).setName('inventory');
        this.hotbarContainer = this.scene.add.container(-320 + 16, 232).setName('hotbar');

        this.popupRange = new PopupRange(scene, inventory);

        this.add([
            this.background,
            this.image,
            this.inventoryContainer,
            this.hotbarContainer,
            this.popupRange
        ])

        this.updateItems()
    }

    updateItems(){
        // Create inventory grid
        this.createGrid(this.inventoryContainer, 4, 5);

        // Create hotbar
        this.createGrid(this.hotbarContainer, 1, 5);
    }

    createGrid(container: Phaser.GameObjects.Container, row: number, col: number) {
        const isHotbar = container.name == 'hotbar'
        const startIndex = isHotbar ? 0 : 5

        container.removeAll(true);

        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                const x = j * 128;
                const y = i * 128;

                const slot = this.scene.add.rectangle(x + 48, y + 48, 128, 128);
                slot.setName((isHotbar ? 'hotbar' : 'inventory')+'-'+(i*5 + j + startIndex))
                slot.setInteractive({ dropZone: true });

                container.add(slot);
            }
        }

        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                const x = j * 128;
                const y = i * 128;

                const item = this.inventory.items[i*5 + j + startIndex];

                if(!item || item.id == '') continue

                const itemIcon = this.scene.add.image(x + 48, y + 48, 'icon-'+item.id);
                itemIcon.setScale(4).setDepth(100);
                itemIcon.setInteractive({ draggable: true });

                // Drag & drop functionality
                this.scene.input.setDraggable(itemIcon);
                itemIcon.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                    itemIcon.x = dragX;
                    itemIcon.y = dragY;
                });

                itemIcon.on('dragend', () => {
                    // Snap back to slot if not dropped on a valid slot
                    itemIcon.x = x + 48;
                    itemIcon.y = y + 48;
                });

                itemIcon.on('drop', (pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) => {
                    if(target.name == 'background'){
                        const x = pointer.x - this.scene.scale.width/2
                        const y = pointer.y - this.scene.scale.height/2

                        if(item.quantity && item.quantity > 1) {
                            this.popupRange.dropMultipleItems(i*5 + j + startIndex, { x: x, y: y }, item.quantity);
                        }
                        else this.inventory.onDropItem(i*5 + j + startIndex, { x: x, y: y })
                    }
                    else if(!target.name || target.name == ''){
                        itemIcon.x = x + 48;
                        itemIcon.y = y + 48;
                    }
                    else{
                        const index = parseInt(target.name.split('-')[1])

                        if(index == i*5 + j + startIndex) return

                        this.inventory.swapItem(i*5 + j + startIndex, index)
        
                        this.updateItems()
                    }
                })

                container.add(itemIcon);

                if(item.quantity > 1){
                    const itemCount = this.scene.add.text(x + 80, y + 80, 'x'+item.quantity, {
                        fontFamily: 'PixelFont', fontSize: 24, color: '#ffffff',
                        stroke: '#000000', strokeThickness: 4
                    }).setOrigin(0.5, 0.5).setDepth(10000000000000000000000000000000000000000)

                    container.add(itemCount)
                }
            }
        }
    }

    destroy() {
        super.destroy(true)
    }
}

class PopupRange extends Phaser.GameObjects.Container {

    scene: GameUI;
    inventory: Inventory;

    dot: Phaser.GameObjects.Arc;
    dropButton: Phaser.GameObjects.Text;
    countText: Phaser.GameObjects.Text;

    constructor(scene: GameUI, inventory: Inventory) {
        super(scene, 0, 0);

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
            this.dropButton.off('pointerdown');
        })

        const box = scene.add.rectangle(0, 0, 500, 200, 0xbbbbbb)
        box.setInteractive()

        const bar = scene.add.rectangle(0, 0, 400, 10, 0x000000);

        this.countText = scene.add.text(0, -60, 'Items Count: 1', {
            fontFamily: 'PixelFont', fontSize: 24, color: '#000000',
        }).setOrigin(0.5, 0.5);

        this.dot = scene.add.arc(-200, 0, 16)
        this.dot.setFillStyle(0xff0000, 1)
        this.dot.setOrigin(0.5, 0.5)
        this.dot.setInteractive({ draggable: true });
        
        this.dropButton = scene.add.text(0, 60, 'Drop Item', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000',
            backgroundColor: '#ffffff', padding: { x: 40, y: 5 }
        }).setOrigin(0.5, 0.5);

        this.add([
            background,
            box,
            bar,
            this.dot,
            this.countText,
            this.dropButton
        ]);
    }

    dropMultipleItems(index: number, dir: { x: number, y: number }, quantity: number) {
        this.setVisible(true);

        this.dot.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
            this.dot.x = dragX;

            const step = 400 / (quantity-1);
            this.dot.x = Math.round((dragX + 200) / step) * step - 200;

            if(this.dot.x < -200) this.dot.x = -200
            if(this.dot.x > 200) this.dot.x = 200
            
            this.countText.setText(`Items Count: ${Math.abs(Math.round((this.dot.x + 200) / 400 * (quantity-1)))+1}`);
        })

        this.dropButton.setInteractive();
        this.dropButton.on('pointerdown', () => {
            const itemCount = Math.abs(Math.round((this.dot.x + 200) / 400 * (quantity-1)))+1;
            this.inventory.onDropItem(index, dir, itemCount);

            this.setVisible(false);
            this.dot.setX(-200)
            this.countText.setText('Items Count: 1')
            this.dot.off('drag')
            this.dropButton.off('pointerdown');
        });
    }
}