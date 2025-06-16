import p from 'planck'
import { Game } from '../scenes/Game';

export class DroppedItem extends Phaser.GameObjects.Container{

    scene: Game
    uid: string
    id: string
    quantity: number
    pBody: p.Body

    sprite: Phaser.GameObjects.Sprite
    countText: Phaser.GameObjects.Text
    
    tween: Phaser.Tweens.Tween;
    timeout: NodeJS.Timeout


    constructor(scene: Game, x: number, y: number, id: string, uid: string, quantity: number){
        super(scene, x*scene.gameScale*32, y*scene.gameScale*32);

        this.sprite = scene.add.sprite(0, 0, 'icon-'+id)
        this.sprite.setScale(0)
        this.sprite.setAlpha(1).setTint(0xdddddd)
        this.sprite.setDepth(1);
        this.sprite.setOrigin(0.5, 0.5);

        this.countText = scene.add.text(32, 32, 'x'+quantity, {
            fontSize: 24, fontFamily: 'PixelFont', color: '#ffffff'
        })
        this.countText.setOrigin(0, 0)
        this.countText.setVisible(quantity > 1)

        this.add([this.sprite, this.countText])

        scene.tweens.add({
            targets: this.sprite,
            duration: 200,
            ease: 'Quad.easeInOut',
            scale: scene.gameScale
        })
        this.tween = scene.tweens.add({
            targets: [this.sprite, this.countText],
            yoyo: true,
            alpha: 0.4,
            duration: 500,
            loop: -1
        })
        this.tween = scene.tweens.add({
            targets: [this.sprite, this.countText],
            yoyo: true,
            y: this.sprite.y - 100,
            duration: 200,
            ease: 'Quad.easeOut',
        })
        
        this.scene = scene;
        this.uid = uid
        this.id = id;
        this.quantity = quantity;
        
        scene.add.existing(this);

        this.pBody = scene.world.createDynamicBody({
            position: new p.Vec2(x, y),
            fixedRotation: true
        })
        this.pBody.createFixture({
            shape: new p.Box(0.3, 0.3),
            isSensor: true
        })
        this.pBody.setUserData(this)

        this.timeout = setTimeout(() => {
            this.destroy();
        }, 30000);
    }

    destroy() {
        this.tween.destroy()
        this.pBody.getWorld().queueUpdate(world => world.destroyBody(this.pBody))
        clearTimeout(this.timeout);
        super.destroy(true);
    }
}