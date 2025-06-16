import { Inventory } from "../Inventory";
import { GameUI } from '../../scenes/GameUI'
import { itemList } from "../ItemInstance";

export class HotbarUI extends Phaser.GameObjects.Container {

    scene: GameUI;
    image: Phaser.GameObjects.Image;
    cooldownBoxs: Phaser.GameObjects.Image[]
    hotbarContainer: Phaser.GameObjects.Container;
    inventory: Inventory;

    border: Phaser.GameObjects.Rectangle;

    constructor(scene: GameUI, inventory: Inventory) {
        super(scene, scene.scale.width, scene.scale.height);

        this.scene = scene;
        scene.add.existing(this);

        this.inventory = inventory

        this.image = this.scene.add.image(-40, -20, 'hotbar');
        this.image.setOrigin(1, 1)
        this.image.setScale(4)
        this.image.setAlpha(0.8)

        this.cooldownBoxs = []

        // Create hotbar
        this.hotbarContainer = this.scene.add.container(-688 + 16, -140);
        this.createGrid(this.hotbarContainer);

        this.border = this.scene.add.rectangle(-688 + 8, -156 + 8, 112, 112)
        this.border.setStrokeStyle(4, 0xeedd33)
        this.border.setOrigin(0)

        this.eventHandler()

        this.add([this.image, this.hotbarContainer, this.border])
    }

    update(){
        for(let i=0; i<5; i++){
            const item = this.inventory.items[i]

            const instanceData = itemList.find(v => v.id === item.id) || itemList[0]

            const frameIndex = Math.floor(Math.max(Math.min((Date.now()-item.timestamp)/instanceData.config.cooldown, 1), 0)*19)
            // console.log(item)
            this.cooldownBoxs[i].setFrame(frameIndex)
        }
    }

    isActiveIndexCooldown(){
        let item = this.inventory.items[this.inventory.activeIndex]

        const instanceData = itemList.find(v => v.id === item.id) || itemList[0]

        console.log(Date.now()-item.timestamp-instanceData.config.cooldown > 0)

        return Date.now()-item.timestamp-instanceData.config.cooldown > 0
    }

    eventHandler(){
        this.scene.input.off('wheel')
        this.scene.input.keyboard?.off('keydown')
        this.scene.input.on('wheel', (pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
            if(pointer.event.defaultPrevented) return

            if (deltaY > 0) {
                this.inventory.activeIndex = (this.inventory.activeIndex + 1) % 5;
            } else if (deltaY < 0) {
                this.inventory.activeIndex = (this.inventory.activeIndex - 1 + 5) % 5;
            }

            this.setActiveIndex(this.inventory.activeIndex);
        })
        this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (event.key === '1') {
                this.setActiveIndex(0)
            } else if (event.key === '2') {
                this.setActiveIndex(1)
            } else if (event.key === '3') {
                this.setActiveIndex(2)
            } else if (event.key === '4') {
                this.setActiveIndex(3)
            } else if (event.key === '5') {
                this.setActiveIndex(4)
            }
        })
    }

    setActiveIndex(index: number) {
        this.border.setX(-688 + 8 + index * 128)

        this.inventory.setActiveIndex(index)

        this.createGrid(this.hotbarContainer);
    }

    createGrid(container: Phaser.GameObjects.Container) {
        this.cooldownBoxs.forEach(v => v.destroy())
        this.cooldownBoxs = []
        container.removeAll(true);

        for (let i = 0; i < 5; i++) {
            const x = i * 128;
            const y = 0;

            const item = this.inventory.items[i];

            if(item && item.id != ''){
                const itemIcon = this.scene.add.image(x + 48, y + 48, 'icon-'+item.id);
                itemIcon.setScale(4).setDepth(100);
                container.add(itemIcon)
            }

            const cooldownBox = this.scene.add.sprite(x + 48, y + 48, 'cooldown-anim')
            cooldownBox.setScale(4)
            cooldownBox.setAlpha(0.6)
            this.cooldownBoxs.push(cooldownBox)

            const box = this.scene.add.rectangle(x + 48, y + 48, 128, 128);
            box.setInteractive();

            box.on('pointerdown', () => {
                this.setActiveIndex(i);
            })

            container.add([box, cooldownBox]);

            if(item.tag == 'resource'){
                const itemCount = this.scene.add.text(x + 80, y + 80, 'x'+item.quantity, {
                    fontFamily: 'PixelFont', fontSize: 24, color: '#ffffff',
                    stroke: '#000000', strokeThickness: 4
                }).setOrigin(0.5, 0.5).setDepth(10000000000000000000000000000000000000000)

                container.add(itemCount)
            }
        }
    }

    destroy() {
        this.scene.input.off('wheel')
        this.scene.input.keyboard?.off('keydown')
        super.destroy(true)
    }
}