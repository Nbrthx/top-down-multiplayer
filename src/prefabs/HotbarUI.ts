import { Inventory } from "./Inventory";

export class HotbarUI extends Phaser.GameObjects.Container {

    scene: Phaser.Scene;
    image: Phaser.GameObjects.Image;
    hotbarContainer: Phaser.GameObjects.Container;
    inventory: Inventory;

    activeIndex: number;
    border: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, inventory: Inventory) {
        super(scene, scene.scale.width, scene.scale.height);

        this.scene = scene;
        scene.add.existing(this);

        this.inventory = inventory
        this.activeIndex = 0

        this.image = this.scene.add.image(-40, -40, 'hotbar');
        this.image.setOrigin(1, 1)
        this.image.setScale(4)

        // Create hotbar
        this.hotbarContainer = this.scene.add.container(-688 + 16, -160);
        this.createGrid(this.hotbarContainer);

        this.border = this.scene.add.rectangle(-688 + 8, -176 + 8, 112, 112)
        this.border.setStrokeStyle(4, 0xeedd33)
        this.border.setOrigin(0)

        this.wheelHandle()

        this.add([this.image, this.hotbarContainer, this.border])
    }

    wheelHandle(){
        let index = this.activeIndex;
        this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
            if (deltaY > 0) {
                index = (index + 1) % 5;
            } else if (deltaY < 0) {
                index = (index - 1 + 5) % 5;
            }

            this.setActiveIndex(index);            
        })
    }

    setActiveIndex(index: number) {
        this.border.setX(-688 + 8 + index * 128)

        this.inventory.setActiveIndex(index)

        this.createGrid(this.hotbarContainer);
    }

    createGrid(container: Phaser.GameObjects.Container) {
        container.removeAll(true);

        for (let i = 0; i < 5; i++) {
            const x = i * 128;
            const y = 0;

            const item = this.inventory.items[i];

            if(item){
                const itemIcon = this.scene.add.image(x + 48, y + 48, 'icon-'+item.id);
                itemIcon.setScale(4).setDepth(100);
                container.add(itemIcon)
            }

            const box = this.scene.add.rectangle(x + 48, y + 48, 128, 128);
            box.setInteractive();

            box.on('pointerdown', () => {
                this.setActiveIndex(i);
            })

            container.add(box);
        }
    }

    destroy() {
        this.scene.input.off('wheel')
        super.destroy(true)
    }
}