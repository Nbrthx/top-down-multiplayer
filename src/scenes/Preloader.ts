import { Scene } from 'phaser';
import { spriteFrames } from '../prefabs/Outfit';
import { HOST_ADDRESS } from './MainMenu';

export interface OutfitList {
    male: {
        hair: string[],
        face: string[],
        body: string[],
        leg: string[]
    },
    female: {
        hair: string[],
        face: string[],
        body: string[],
        leg: string[]
    }
}
export class Preloader extends Scene{

    outfitList: OutfitList
    constructor (){
        super('Preloader');
    }

    init (){
        this.add.rectangle(this.scale.width/2, this.scale.height/2, 470, 34)
        .setStrokeStyle(2, 0xffffff)
        .setRounded(16)

        const bar = this.add.rectangle(this.scale.width/2-232, this.scale.height/2, 4, 28, 0x33ccaa);
        bar.setRounded(16)
        bar.setOrigin(0, 0.5);

        const bar2 = this.add.rectangle(this.scale.width/2-222, this.scale.height/2, 4, 14, 0x66ffcc);
        bar2.setRounded(4)
        bar2.setOrigin(0, 0.8);

        this.load.on('progress', (progress: number) => {
            bar.setSize(4 + (460 * progress), 28);
            bar2.setSize(4 + (440 * progress), 14);
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

        // Visual Effects
        this.load.spritesheet('punch', 'effect/punch.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('throw', 'effect/throw.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('sword', 'effect/sword.png', { frameWidth: 96, frameHeight: 96 })
        this.load.spritesheet('bow', 'effect/bow.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('dagger', 'effect/dagger.png', { frameWidth: 96, frameHeight: 64 })

        this.load.spritesheet('explode', 'effect/explode.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('arrow', 'effect/arrow.png', { frameWidth: 48, frameHeight: 16 })
        this.load.spritesheet('blue-knife', 'effect/blue-knife.png', { frameWidth: 32, frameHeight: 16 })

        // Particles
        this.load.image('red-circle-particle', 'particles/red-circle.png')

        // Icon
        this.load.image('icon-fc', 'icon/fracture-coins.png')
        this.load.image('icon-sword', 'icon/sword.png')
        this.load.image('icon-bow', 'icon/bow.png')
        this.load.image('icon-dagger', 'icon/dagger.png')
        this.load.image('icon-blue-knife', 'icon/blue-knife.png')
        this.load.image('icon-wood', 'icon/wood.png')
        this.load.image('icon-fracture-coins', 'icon/fracture-coins.png')
        this.load.image('icon-wrapped-hair', 'icon/wrapped-hair.png')
        this.load.image('icon-wrapped-face', 'icon/wrapped-face.png')
        this.load.image('icon-wrapped-body', 'icon/wrapped-body.png')
        this.load.image('icon-wrapped-leg', 'icon/wrapped-leg.png')

        // Environtment
        this.load.image('tilemaps', 'environment/tilemaps2.png')
        this.load.spritesheet('tree1', 'environment/tree1.png', { frameWidth: 96, frameHeight: 128 })

        this.load.tilemapTiledJSON('map1', 'environment/map1.json')
        this.load.tilemapTiledJSON('map2', 'environment/map2.json')
        this.load.tilemapTiledJSON('map3', 'environment/map3.json')
        this.load.tilemapTiledJSON('map4', 'environment/map4.json')
        this.load.tilemapTiledJSON('map5', 'environment/map5.json')
        this.load.tilemapTiledJSON('duel', 'environment/duel.json')

        // UI
        this.load.image('inventory', 'ui/inventory.png')
        this.load.image('clear-inventory', 'ui/clear-inventory.png')
        this.load.image('trade', 'ui/trade.png')
        this.load.image('inventory-icon', 'ui/inventory-icon.png')
        this.load.image('hotbar', 'ui/hotbar.png')
        this.load.image('stats', 'ui/stats.png')
        this.load.image('ask-button', 'ui/ask-button.png')
        this.load.image('ui-change-outfit', 'ui/change-outfit.png')
        this.load.image('ui-fullscreen', 'ui/fullscreen.png')
        this.load.image('ui-debug', 'ui/debug.png')
        this.load.image('ui-chat', 'ui/chat.png')

        this.load.spritesheet('cooldown-anim', 'ui/cooldown-anim.png', { frameWidth: 24, frameHeight: 24 })

        this.load.image('box-nineslice', 'ui/box-nineslice.png')
        this.load.image('button-nineslice', 'ui/button-nineslice.png')

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
            key: 'punch-attack',
            frames: this.anims.generateFrameNumbers('punch', { frames: [0, 1, 2, 3, 4] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'throw-attack',
            frames: this.anims.generateFrameNumbers('throw', { frames: [0, 0, 0, 0, 1, 2, 3, 4] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'sword-attack',
            frames: this.anims.generateFrameNumbers('sword', { frames: [0, 0, 0, 1, 2, 3, 4, 5, 5] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'bow-attack',
            frames: this.anims.generateFrameNumbers('bow', { frames: [0, 1, 2, 3, 4, 4] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'dagger-attack',
            frames: this.anims.generateFrameNumbers('dagger', { frames: [0, 0, 0, 1, 1, 2, 3, 4, 5, 6, 7, 8] }),
            frameRate: 20
        })
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explode', { frames: [0, 1, 2, 3] }),
            frameRate: 30
        })

        this.anims.create({
            key: 'tree1-wave',
            frames: this.anims.generateFrameNumbers('tree1', { frames: [0, 1, 2, 3, 4, 5, 0, 6, 7, 8, 9, 10] }),
            frameRate: 10,
            repeat: -1
        })

        this.externalLoader(() => {
            this.scene.start('MainMenu', { autoJoin: true });
        })
    }

    externalLoader(callback: () => void){
        this.load.json('outfit-list', HOST_ADDRESS+'/outfit-list')
        this.load.json('npc-list', HOST_ADDRESS+'/npc-list')
        this.load.json('item-list', HOST_ADDRESS+'/item-list')
        this.load.json('enemy-list', HOST_ADDRESS+'/enemy-list')
        this.load.start();

        this.load.on('complete', () => {
            if(!this.outfitList){
                this.outfitList = this.cache.json.get('outfit-list')

                // Character Male
                for (const _key in this.outfitList.male) {
                    const key = _key as keyof typeof this.outfitList.male
                    for (const outfit of this.outfitList.male[key]) {
                        this.load.spritesheet(`${outfit}-${key}-male`, `character/male/${key}/${outfit}.png`, { frameWidth: 64, frameHeight: 64 });
                    }
                }

                // Character Female
                for (const _key in this.outfitList.female) {
                    const key = _key as keyof typeof this.outfitList.male
                    for (const outfit of this.outfitList.female[key]) {
                        this.load.spritesheet(`${outfit}-${key}-female`, `character/female/${key}/${outfit}.png`, { frameWidth: 64, frameHeight: 64 });
                    }
                }

                this.load.start();
            }
            else{
                // Character Male Anims
                for (const _key in this.outfitList.male) {
                    const key = _key as keyof typeof this.outfitList.male

                    for (const outfit of this.outfitList.male[key]) {
                        const animations: ['idle', 'runup', 'rundown'] = ['idle', 'runup', 'rundown'];
                        animations.forEach(anim => {
                            const frames = spriteFrames[anim][key];
                            this.anims.create({
                                key: `${outfit}-${key}-male-${anim}`,
                                frames: this.anims.generateFrameNumbers(`${outfit}-${key}-male`, { frames: frames }),
                                frameRate: 12,
                                repeat: -1
                            });
                        });
                    }
                }

                // Character Female Anims
                for (const _key in this.outfitList.female) {
                    const key = _key as keyof typeof this.outfitList.female

                    for (const outfit of this.outfitList.female[key]) {
                        const animations: ['idle', 'runup', 'rundown'] = ['idle', 'runup', 'rundown'];
                        animations.forEach(anim => {
                            const frames = spriteFrames[anim][key];
                            this.anims.create({
                                key: `${outfit}-${key}-female-${anim}`,
                                frames: this.anims.generateFrameNumbers(`${outfit}-${key}-female`, { frames: frames }),
                                frameRate: 12,
                                repeat: -1
                            });
                        });
                    }
                }
                callback()
            }
        })

        this.load.on('loaderror', () => {
            this.add.text(this.scale.width/2, this.scale.height/2+50, 'Failed to load resources, server may be down or maintenance. Try again later.')
            .setOrigin(0.5)
            .setStyle({ fontSize: '32px', color: '#ffffff' })
            .setShadow(2, 2, '#333333', 2, true, true);
        })
    }
}
