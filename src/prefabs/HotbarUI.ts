import { Inventory } from "./Inventory";

export class HotbarUI extends Phaser.GameObjects.Container {

    scene: Phaser.Scene;
    image: Phaser.GameObjects.Image;
    hotbarContainer: Phaser.GameObjects.Container;
    inventory: Inventory;

    activeIndex: number;
    border: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, inventory: Inventory) {
        super(scene);

        this.scene = scene;
        scene.add.existing(this);

        this.inventory = inventory
        this.activeIndex = 0

        this.image = this.scene.add.image(1880, 1040, 'hotbar');
        this.image.setOrigin(1, 1)
        this.image.setScale(4)

        // Create hotbar
        this.hotbarContainer = this.scene.add.container(1880 - 648 + 16, 920);
        this.createGrid(this.hotbarContainer);

        this.border = this.scene.add.rectangle(1880 - 648 + 8, 904 + 8, 112, 112)
        this.border.setStrokeStyle(4, 0xeedd33)
        this.border.setOrigin(0)

        this.wheelHandle()

        this.add([this.image, this.hotbarContainer, this.border])
    }

    wheelHandle(){
        this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
            if (deltaY > 0) {
                this.activeIndex = (this.activeIndex + 1) % 5;
            } else if (deltaY < 0) {
                this.activeIndex = (this.activeIndex - 1 + 5) % 5;
            }

            this.border.setX(1880 - 648 + 8 + this.activeIndex * 128)

            this.inventory.setActiveIndex(this.activeIndex)

            this.createGrid(this.hotbarContainer);
        })
    }

    createGrid(container: Phaser.GameObjects.Container) {
        container.removeAll(true);

        for (let i = 0; i < 5; i++) {
            const x = i * 128;
            const y = 0;

            const item = this.inventory.items[i];

            if(!item) continue

            const itemText = this.scene.add.text(x + 5, y + 5, item.name, {
                fontSize: '18px',
                color: '#000',
                fontStyle: 'bold'
            });
            itemText.setDepth(100);
            itemText.setInteractive();

            container.add(itemText);
        }
    }

    destroy() {
        this.scene.input.off('wheel')
        super.destroy(true)
    }
}