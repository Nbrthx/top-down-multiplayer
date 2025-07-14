import { Game } from "../scenes/Game";

export const spriteFrames = {
    idle: {
        hair: [0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        face: [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4, 5, 5, 0],
        body: [0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 1, 1, 0],
        leg: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0]
    },
    rundown: {
        hair: [12, 13, 14, 15, 16, 17, 18, 19],
        face: [6, 1, 2, 9, 6, 7, 8, 9, 6, 7, 8, 9],
        body: [3, 4, 5, 6, 7, 8, 9, 10],
        leg: [2, 3, 4, 5, 6, 7, 8, 9]
    },
    runup: {
        hair: [20, 21, 22, 23, 24, 25, 26, 27],
        face: [10, 11, 12, 13, 10, 11, 12, 13],
        body: [11, 12, 13, 14, 15, 16, 17, 18],
        leg: [10, 11, 12, 13, 14, 15, 16, 17]
    }
}


export class Outfit extends Phaser.GameObjects.Container{

    hairImage: Phaser.GameObjects.Sprite
    faceImage: Phaser.GameObjects.Sprite
    bodyImage: Phaser.GameObjects.Sprite
    legImage: Phaser.GameObjects.Sprite

    outfit: {
        isMale: boolean
        color: number
        hair: string,
        face: string,
        body: string,
        leg: string
    }

    currentAnim: string
    isAnimLooping: boolean

    constructor(scene: Game){
        super(scene)

        this.legImage = scene.add.sprite(0, -36, 'basic-leg-female').setScale(scene.gameScale)
        this.bodyImage = scene.add.sprite(0, -36, 'basic-body-female').setScale(scene.gameScale)
        this.faceImage = scene.add.sprite(0, -36, 'basic-face-female').setScale(scene.gameScale)
        this.hairImage = scene.add.sprite(0, -36, 'basic-hair-female').setScale(scene.gameScale)

        this.legImage.setPipeline('Light2D')
        this.bodyImage.setPipeline('Light2D')
        this.faceImage.setPipeline('Light2D')
        this.hairImage.setPipeline('Light2D')

        this.outfit = {
            isMale: false,
            color: 0xffffff,
            hair: 'basic',
            face: 'basic',
            body: 'basic',
            leg: 'basic'
        }

        this.add([this.legImage, this.bodyImage, this.faceImage, this.hairImage])
    }

    setOutfit(isMale: boolean, color: number, hair: string, face: string, body: string, leg: string){
        const genderKey = isMale ? 'male' : 'female'

        if(!this.scene.textures.exists(`${leg}-leg-${genderKey}`)) leg = 'basic'
        if(!this.scene.textures.exists(`${body}-body-${genderKey}`)) body = 'basic'
        if(!this.scene.textures.exists(`${face}-face-${genderKey}`)) face = 'basic'
        if(!this.scene.textures.exists(`${hair}-hair-${genderKey}`)) hair = 'basic'

        this.legImage.setTexture(`${leg}-leg-${genderKey}`)
        this.bodyImage.setTexture(`${body}-body-${genderKey}`)
        this.faceImage.setTexture(`${face}-face-${genderKey}`)
        this.hairImage.setTexture(`${hair}-hair-${genderKey}`)

        this.changeHairColor(color)

        this.outfit = {
            isMale,
            color,
            hair,
            face,
            body,
            leg
        }
    }

    changeOutfit(model: string, outfit: string){
        let sprite: Phaser.GameObjects.Sprite | null = null
        if(model == 'hair') sprite = this.hairImage
        else if(model == 'face') sprite = this.faceImage
        else if(model == 'body') sprite = this.bodyImage
        else if(model == 'leg') sprite = this.legImage

        const genderKey = this.outfit.isMale ? 'male' : 'female'

        if(sprite && this.scene.textures.exists(`${outfit}-${model}-${genderKey}`)){
            sprite.setTexture(`${outfit}-${model}-${genderKey}`)

            if(this.currentAnim){
                this.stopAnim()
                this.play(this.currentAnim, this.isAnimLooping)
            }
        }

    }

    changeGender(isMale: boolean){
        this.outfit.isMale = isMale

        this.changeOutfit('hair', 'basic')
        this.changeOutfit('face', 'basic')
        this.changeOutfit('body', 'basic')
        this.changeOutfit('leg', 'basic')
    }

    changeHairColor(color: number){
        this.hairImage.setTint(color)
        this.outfit.color = color
    }

    play(animation: string, loop: boolean = false){
        const hairKey = `${this.hairImage.texture.key}-${animation}`
        const faceKey = `${this.faceImage.texture.key}-${animation}`
        const bodyKey = `${this.bodyImage.texture.key}-${animation}`
        const legKey = `${this.legImage.texture.key}-${animation}`

        this.currentAnim = animation
        this.isAnimLooping = loop

        this.hairImage.play(hairKey, loop)
        this.faceImage.play(faceKey, loop)
        this.bodyImage.play(bodyKey, loop)
        this.legImage.play(legKey, loop)
    }

    stopAnim(){
        this.hairImage.stop()
        this.faceImage.stop()
        this.bodyImage.stop()
        this.legImage.stop()
    }

    setFlipX(flipX: boolean){
        this.hairImage.setFlipX(flipX)
        this.faceImage.setFlipX(flipX)
        this.bodyImage.setFlipX(flipX)
        this.legImage.setFlipX(flipX)
    }

    isTinted(){
        return this.faceImage.isTinted || this.bodyImage.isTinted || this.legImage.isTinted
    }

    clearTint(){
        this.hairImage.clearTint()
        this.hairImage.setTint(this.outfit.color)
        this.faceImage.clearTint()
        this.bodyImage.clearTint()
        this.legImage.clearTint()
    }

    setTintFill(color: number){
        this.hairImage.setTintFill(color)
        this.faceImage.setTintFill(color)
        this.bodyImage.setTintFill(color)
        this.legImage.setTintFill(color)
    }

    setPipeline(pipeline: string){
        this.hairImage.setPipeline(pipeline)
        this.faceImage.setPipeline(pipeline)
        this.bodyImage.setPipeline(pipeline)
        this.legImage.setPipeline(pipeline)
    }

    resetPipeline(){
        this.hairImage.resetPipeline()
        this.faceImage.resetPipeline()
        this.bodyImage.resetPipeline()
        this.legImage.resetPipeline()
    }
}