export class InventoryUI extends Phaser.GameObjects.Container {

    scene: Phaser.Scene;
    image: Phaser.GameObjects.Image;
    inventory: Phaser.GameObjects.Container;
    hotbar: Phaser.GameObjects.Container;
    items: { id: string; name: string }[];
    activeItems: { id: string; name: string }[];

    constructor(scene: Phaser.Scene) {
        super(scene);

        this.scene = scene;
        scene.add.existing(this);

        this.items = [];
        this.activeItems = [];

        this.create();
    }

    create() {
        this.image = this.scene.add.image(960, 540, 'inventory');
        this.image.setScale(4)

        // Load items into memory
        this.items = [
            { id: 'item1', name: 'Item 1' },
            { id: 'item2', name: 'Item 2' },
            { id: 'item3', name: 'Item 3' },
            { id: 'item4', name: 'Item 4' },
            { id: 'item5', name: 'Item 5' },
            { id: 'item6', name: 'Item 6' },
        ];
        this.activeItems = [
            { id: 'item1', name: 'Item 7' },
            { id: 'item2', name: 'Item 8' },
            { id: 'item3', name: 'Item 9' },
            { id: 'item4', name: 'Item 10' },
        ];

        // Create inventory grid
        this.inventory = this.scene.add.container(960 - 320 + 16, 148);
        this.createGrid(this.inventory, 5, 5, this.items);

        // Create hotbar
        this.hotbar = this.scene.add.container(960 - 320 + 16, 836);
        this.createGrid(this.hotbar, 1, 5, this.activeItems, true);

        this.add([this.image, this.inventory, this.hotbar])
    }

    createGrid(container: Phaser.GameObjects.Container, row: number, col: number, items: { id: string; name: string }[], isHotbar: boolean = false) {
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                const x = j * 128;
                const y = i * 128;

                const slot = this.scene.add.rectangle(x + 48, y + 48, 128, 128);
                slot.setName((isHotbar ? 'hotbar' : 'inventory')+'-'+(i*5 + j))
                slot.setInteractive({ dropZone: true });

                container.add(slot);
            }
        }

        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                const x = j * 128;
                const y = i * 128;

                const item = items[i*5 + j];

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
                    const temp = items[i*5 + j]

                    const itemSpace = target.name.split('-')[0]
                    const index = parseInt(target.name.split('-')[1])

                    if(itemSpace == 'hotbar'){
                        items[i*5 + j] = this.activeItems[index] || null
                        this.activeItems[index] = temp
                    } else {
                        items[i*5 + j] = this.items[index] || null
                        this.items[index] = temp
                    }

                    this.inventory.removeAll(true)
                    this.hotbar.removeAll(true)
    
                    this.createGrid(this.inventory, 5, 5, this.items)
                    this.createGrid(this.hotbar, 1, 5, this.activeItems, true);
                })

                container.add(itemText);
            }
        }
    }
}