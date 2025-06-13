import p from 'planck'
import { Game } from '../scenes/Game';

export class DroppedItem extends Phaser.GameObjects.Image{

    scene: Game
    uid: string
    id: string
    pBody: p.Body
    
    tween: Phaser.Tweens.Tween;
    timeout: NodeJS.Timeout


    constructor(scene: Game, x: number, y: number, id: string, uid: string){
        super(scene, x*scene.gameScale*32, y*scene.gameScale*32, 'icon-'+id);

        this.setScale(0)
        this.setAlpha(1).setTint(0xdddddd)

        scene.tweens.add({
            targets: this,
            duration: 200,
            ease: 'Quad.easeInOut',
            scale: scene.gameScale
        })
        this.tween = scene.tweens.add({
            targets: this,
            yoyo: true,
            alpha: 0.4,
            duration: 500,
            loop: -1
        })
        this.tween = scene.tweens.add({
            targets: this,
            yoyo: true,
            y: this.y - 100,
            duration: 200,
            ease: 'Quad.easeOut',
        })
        
        this.scene = scene;
        this.uid = uid
        this.id = id;
        
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

        this.setDepth(1);
        this.setOrigin(0.5, 0.5);

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