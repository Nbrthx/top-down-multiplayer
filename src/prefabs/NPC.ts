import { Game } from '../scenes/Game'

export const NPClist: {
    id: string
    name: string
    sprite: string
    biography: string
}[] = [{
    id: 'npc1',
    name: 'Goblin Hunter',
    sprite: 'char',
    biography: 'A skilled hunter from the Goblin tribe, known for their agility and cunning traps. They are always on the lookout for new challenges and prey.'
}]

export class NPC extends Phaser.GameObjects.Container{

    id: string

    scene: Game
    sprite: Phaser.GameObjects.Sprite
    askButton: Phaser.GameObjects.Image
    nameText: Phaser.GameObjects.Text

    constructor(scene: Game, x: number, y: number, id: string){
        super(scene, x, y)

        this.scene = scene
        this.id = id

        scene.add.existing(this)

        this.sprite = scene.add.sprite(0, -36, 'char').setScale(scene.gameScale)
        this.sprite.setTint(0xffffcc)
        this.sprite.play('idle')

        this.askButton = scene.add.image(0, -200, 'ask-button').setScale(scene.gameScale)
        this.askButton.setInteractive()

        scene.tweens.add({
            targets: this.askButton,
            scale: 3.8,
            y: this.askButton.y+4,
            yoyo: true,
            repeat: -1,
            duration: 300
        })

        this.nameText = scene.add.text(0, -34*scene.gameScale, NPClist.find(v => v.id == id)?.name || '', {
            fontFamily: 'PixelFont', fontSize: 24, letterSpacing: 2,
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setResolution(4)
        
        const shadow = scene.add.image(0, 19*scene.gameScale, 'shadow').setAlpha(0.4).setScale(scene.gameScale)

        this.setDepth(this.y/scene.gameScale)

        this.add([shadow, this.sprite, this.askButton, this.nameText])
    }

    update(){
        const isFlip = this.x - this.scene.player.x > 0
        this.sprite.setFlipX(isFlip)
        
        if(isFlip && this.askButton.x != -8) this.askButton.setX(-8)
        else if(!isFlip && this.askButton.x != 8) this.askButton.setX(8)
    }

    destroy() {
        super.destroy()
    }
}