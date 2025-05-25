import { Inventory } from "./Inventory";

export class InventoryUI extends Phaser.GameObjects.Container {

    scene: Phaser.Scene;
    image: Phaser.GameObjects.Image;
    inventory: Inventory;
    inventoryContainer: Phaser.GameObjects.Container;
    hotbarContainer: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, inventory: Inventory) {
        super(scene);

        this.scene = scene;
        scene.add.existing(this);

        this.inventory = inventory;

        this.image = this.scene.add.image(scene.scale.width / 2, scene.scale.height / 2, 'inventory');
        this.image.setScale(4)

        this.inventoryContainer = this.scene.add.container(scene.scale.width / 2 - 320 + 16, 212).setName('inventory');
        this.hotbarContainer = this.scene.add.container(scene.scale.width / 2 - 320 + 16, 772).setName('hotbar');

        this.add([this.image, this.inventoryContainer, this.hotbarContainer])

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

                if(!item) continue

                const itemText = this.scene.add.text(x + 5, y + 5, item.name, {
                    fontSize: '18px',
                    color: '#000',
                    fontStyle: 'bold'
                });
                itemText.setDepth(100);
                itemText.setInteractive({ draggable: true });

                // Drag & drop functionality
                this.scene.input.setDraggable(itemText);
                itemText.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                    itemText.x = dragX;
                    itemText.y = dragY;
                });

                itemText.on('dragend', () => {
                    // Snap back to slot if not dropped on a valid slot
                    itemText.x = x + 5;
                    itemText.y = y + 5;
                });

                itemText.on('drop', (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) => {
                    const index = parseInt(target.name.split('-')[1])

                    this.inventory.swapItem(i*5 + j + startIndex, index)
    
                    this.updateItems()
                })

                container.add(itemText);
            }
        }
    }

    destroy() {
        super.destroy(true)
    }
}