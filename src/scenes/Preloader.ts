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
        this.load.image('shadow', 'character/shadow.png')
        this.load.spritesheet('char', 'character/char2.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('frogger', 'character/frogger.png', { frameWidth: 384, frameHeight: 128 })

        // Visual Effects
        this.load.spritesheet('punch', 'effect/punch.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('throw', 'effect/throw.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('sword', 'effect/sword.png', { frameWidth: 96, frameHeight: 96 })
        this.load.spritesheet('bow', 'effect/bow.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('dagger', 'effect/dagger.png', { frameWidth: 96, frameHeight: 64 })

        this.load.spritesheet('arrow', 'effect/arrow.png', { frameWidth: 48, frameHeight: 16 })
        this.load.spritesheet('blue-knife', 'effect/blue-knife.png', { frameWidth: 32, frameHeight: 16 })

        // Particles
        this.load.image('red-circle-particle', 'particles/red-circle.png')

        // Icon
        this.load.image('icon-sword', 'icon/sword.png')
        this.load.image('icon-bow', 'icon/bow.png')
        this.load.image('icon-dagger', 'icon/dagger.png')
        this.load.image('icon-blue-knife', 'icon/blue-knife.png')
        this.load.image('icon-inventory', 'icon/inventory.png')

        // Environtment
        this.load.image('tilemaps', 'environment/tilemaps2.png')
        this.load.image('tree1', 'environment/tree1.png')

        this.load.tilemapTiledJSON('test', 'environment/test.json')
        this.load.tilemapTiledJSON('test2', 'environment/test2.json')

        // UI
        this.load.image('inventory', 'ui/inventory.png')
        this.load.image('hotbar', 'ui/hotbar.png')
        this.load.image('stats', 'ui/stats.png')
        this.load.spritesheet('cooldown-anim', 'ui/cooldown-anim.png', { frameWidth: 24, frameHeight: 24 })

        this.load.image('logo', 'logo.png');

        // Audio
        this.load.audio('audio-step', 'audio/step.wav')
        this.load.audio('audio-hit', 'audio/hit.ogg')

        this.load.audio('audio-punch', 'audio/punch.wav')
        this.load.audio('audio-throw', 'audio/punch.wav')
        this.load.audio('audio-sword', 'audio/sword.mp3')
        this.load.audio('audio-bow', 'audio/bow.wav')
        this.load.audio('audio-dagger', 'audio/dagger.wav')
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
            key: 'frogger-idle',
            frames: this.anims.generateFrameNumbers('frogger', { frames: [17, 18, 19, 20] }),
            frameRate: 10,
            repeat: -1
        })
        this.anims.create({
            key: 'frogger-run',
            frames: this.anims.generateFrameNumbers('frogger', { frames: [51, 52, 53, 54, 55, 56, 57, 58] }),
            frameRate: 12,
            repeat: -1
        })

        this.anims.create({
            key: 'punch-attack',
            frames: this.anims.generateFrameNumbers('punch', { frames: [0, 1, 2, 3, 4] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'throw-attack',
            frames: this.anims.generateFrameNumbers('throw', { frames: [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'sword-attack',
            frames: this.anims.generateFrameNumbers('sword', { frames: [0, 0, 0, 1, 2, 3, 4, 5, 5, 5, 5] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'bow-attack',
            frames: this.anims.generateFrameNumbers('bow', { frames: [0, 1, 2, 3, 3, 4, 4, 4, 0] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'dagger-attack',
            frames: this.anims.generateFrameNumbers('dagger', { frames: [0, 0, 0, 1, 1, 2, 3, 4, 5, 6, 7, 8] }),
            frameRate: 20
        })

        this.scene.start('MainMenu', { autoJoin: true });
    }
}
