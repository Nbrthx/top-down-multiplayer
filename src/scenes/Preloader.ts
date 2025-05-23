import { Scene } from 'phaser';

export class Preloader extends Scene{
    constructor (){
        super('Preloader');
    }

    init (){
        this.add.rectangle(960, 540, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(960-230, 540, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);

        });
    }

    preload (){
        this.load.setPath('assets');

        this.load.image('bg', 'bg.png')

        this.load.html('loginform', 'html/loginform.html')
        this.load.html('registerform', 'html/registerform.html')

        this.load.spritesheet('char', 'character/char2.png', { frameWidth: 64, frameHeight: 64 })

        this.load.spritesheet('punch', 'effect/punch.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('sword', 'effect/sword.png', { frameWidth: 64, frameHeight: 64 })

        this.load.image('tilemaps', 'environment/tilemaps.png')

        this.load.tilemapTiledJSON('test', 'environment/test.json')

        this.load.image('inventory', 'ui/inventory.png')
        this.load.image('hotbar', 'ui/hotbar.png')

        this.load.image('logo', 'logo.png');
    }

    create (){
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('char', { frames: [0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
            frameRate: 10,
            repeat: -1
        })
        this.anims.create({
            key: 'run-down',
            frames: this.anims.generateFrameNumbers('char', { frames: [12, 13, 14, 15, 16, 17, 18, 19] }),
            frameRate: 12,
            repeat: -1
        })
        this.anims.create({
            key: 'run-up',
            frames: this.anims.generateFrameNumbers('char', { frames: [24, 25, 26, 27, 28, 29, 30, 31] }),
            frameRate: 12,
            repeat: -1
        })

        this.anims.create({
            key: 'punch-attack',
            frames: this.anims.generateFrameNumbers('punch', { frames: [0, 1, 2, 3, 4] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'sword-attack',
            frames: this.anims.generateFrameNumbers('sword', { frames: [0, 1, 2, 3, 4, 5, 5, 5, 5] }),
            frameRate: 20
        })

        this.scene.start('MainMenu');
    }
}
