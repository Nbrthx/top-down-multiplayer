import { Inventory } from "./Inventory";

export class InventoryUI extends Phaser.GameObjects.Container {

    scene: Phaser.Scene;
    image: Phaser.GameObjects.Image;
    inventory: Inventory;
    inventoryContainer: Phaser.GameObjects.Container;
    hotbarContainer: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, inventory: Inventory) {
        super(scene, scene.scale.width / 2, scene.scale.height / 2);

        this.scene = scene;
        scene.add.existing(this);

        this.inventory = inventory;

        this.image = this.scene.add.image(0, 0, 'inventory');
        this.image.setScale(4)
        this.image.setInteractive()

        this.inventoryContainer = this.scene.add.container(-320 + 16, -328).setName('inventory');
        this.hotbarContainer = this.scene.add.container(-320 + 16, 232).setName('hotbar');

        this.background = scene.add.rectangle(0, 0, 1920, 1080)
        this.background.setInteractive()

        this.add([this.background, this.image, this.inventoryContainer, this.hotbarContainer])

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

                itemIcon.on('drop', (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) => {
                    const index = parseInt(target.name.split('-')[1])

                    this.inventory.swapItem(i*5 + j + startIndex, index)
    
                    this.updateItems()
                })

                container.add(itemIcon);
            }
        }
    }

    destroy() {
        super.destroy(true)
    }
}