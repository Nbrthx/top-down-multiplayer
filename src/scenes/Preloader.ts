import { Scene } from 'phaser';

export class Preloader extends Scene{
    constructor (){
        super('Preloader');
    }

    init (){
        this.add.rectangle(this.scale.width/2, 540, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(this.scale.width/2-230, 540, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);

        });
    }

    preload (){
        this.load.setPath('assets');

        this.load.image('bg', 'bg.png')

        // HTML
        this.load.html('chatbox', 'html/chatbox.html')
        this.load.html('loginform', 'html/loginform.html')
        this.load.html('registerform', 'html/registerform.html')

        // Character
        this.load.spritesheet('char', 'character/char2.png', { frameWidth: 64, frameHeight: 64 })

        // Visual Effects
        this.load.spritesheet('punch', 'effect/punch.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('sword', 'effect/sword.png', { frameWidth: 96, frameHeight: 96 })
        this.load.spritesheet('bow', 'effect/bow.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('arrow', 'effect/arrow.png', { frameWidth: 48, frameHeight: 48 })

        // Icon
        this.load.image('icon-sword', 'icon/sword.png')
        this.load.image('icon-bow', 'icon/bow.png')

        // Environtment
        this.load.image('tilemaps', 'environment/tilemaps.png')

        this.load.tilemapTiledJSON('test', 'environment/test.json')
        this.load.tilemapTiledJSON('test2', 'environment/test2.json')

        // UI
        this.load.image('inventory', 'ui/inventory.png')
        this.load.image('hotbar', 'ui/hotbar.png')

        this.load.image('logo', 'logo.png');

        // Audio
        this.load.audio('audio-hit', 'audio/hit.ogg')
        this.load.audio('audio-punch', 'audio/punch.wav')
        this.load.audio('audio-sword', 'audio/sword.mp3')
        this.load.audio('audio-step', 'audio/step.wav')
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
        this.anims.create({
            key: 'bow-attack',
            frames: this.anims.generateFrameNumbers('bow', { frames: [1, 2, 3, 4, 5, 5, 5, 0] }),
            frameRate: 20
        })

        this.scene.start('MainMenu');
    }
}
