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

    constructor(scene: Game, x: number, y: number, id: string){
        super(scene, x, y)

        this.scene = scene
        this.id = id

        scene.add.existing(this)

        this.sprite = scene.add.sprite(0, -36, 'char').setScale(scene.gameScale)
        this.sprite.setTint(0xffffcc)
        this.sprite.play('idle')

        this.askButton = scene.add.image(0, -180, 'ask-button').setScale(scene.gameScale)
        this.askButton.setInteractive()

        scene.tweens.add({
            targets: this.askButton,
            scale: 3.8,
            y: this.askButton.y+4,
            yoyo: true,
            repeat: -1,
            duration: 300
        })
        
        const shadow = scene.add.image(0, 19*scene.gameScale, 'shadow').setAlpha(0.4).setScale(scene.gameScale)

        this.setDepth(this.y/scene.gameScale)

        this.add([shadow, this.sprite, this.askButton])
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