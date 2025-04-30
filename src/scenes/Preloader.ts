import { Scene } from 'phaser';

export class Preloader extends Scene{
    constructor (){
        super('Preloader');
    }

    init (){
        this.add.image(512, 384, 'background');
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);

        });
    }

    preload (){
        this.load.setPath('assets');

        this.load.spritesheet('char', 'char.png', { frameWidth: 64, frameHeight: 64 })
        this.load.image('tilemaps', 'tilemaps.png')

        this.load.tilemapTiledJSON('test', 'test.json')

        this.load.image('logo', 'logo.png');
    }

    create (){
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('char', { frames: [0, 0, 0, 1, 2, 3] }),
            frameRate: 10,
            repeat: -1
        })
        this.anims.create({
            key: 'run-down',
            frames: this.anims.generateFrameNumbers('char', { frames: [8, 9, 10, 10, 10, 11, 12, 13, 14, 14, 14, 15] }),
            frameRate: 20,
            repeat: -1
        })
        this.anims.create({
            key: 'run-up',
            frames: this.anims.generateFrameNumbers('char', { frames: [16, 17, 18, 18, 18, 19, 20, 21, 22, 22, 22, 23] }),
            frameRate: 20,
            repeat: -1
        })

        this.scene.start('MainMenu');
    }
}
