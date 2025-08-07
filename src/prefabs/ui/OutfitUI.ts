import { GameUI } from "../../scenes/GameUI"
import { OutfitList } from "../../scenes/Preloader"
import { Player } from "../Player"

export class OutfitUI extends Phaser.GameObjects.Container {

    scene: GameUI
    player: Player
    ownedOutfits: string[]
    isWrapMode: boolean = false
    
    image: Phaser.GameObjects.NineSlice
    background: Phaser.GameObjects.Rectangle
    changeGender: Phaser.GameObjects.Text
    buttons: Phaser.GameObjects.Text[]
    hairColors: Phaser.GameObjects.Rectangle[]
    outfitList: OutfitList
    wrapOutfit: Phaser.GameObjects.Text

    constructor(scene: GameUI, player: Player, ownedOutfits: string[]) {
        super(scene, 0, scene.scale.height)

        this.scene = scene
        this.player = player
        this.ownedOutfits = ownedOutfits

        scene.add.existing(this)

        this.outfitList = scene.cache.json.get('outfit-list')

        this.image = scene.add.nineslice(scene.scale.width/2, -200, 'box-nineslice', 0, scene.scale.width/4, 100, 16, 16, 16, 16)
        this.image.setScale(4).setInteractive()

        this.background = scene.add.rectangle(scene.scale.width/2, -scene.scale.height/4*3+100, scene.scale.width, scene.scale.height/2+200)
        this.background.setInteractive()
        this.background.on('pointerdown', () => {
            this.setVisible(false)
        })

        this.changeGender = scene.add.text(scene.scale.width-100, -300, 'Change Gender', {
            fontSize: 40, color: '#000000', fontStyle: 'bold', fontFamily: 'PixelFont',
            stroke: '#ffffff', strokeThickness: 4
        }).setOrigin(1, 0.5).setInteractive().on('pointerdown', () => {
            this.scene.socket.emit('changeGender', !player.sprite.outfit.isMale)
            player.sprite.changeGender(!player.sprite.outfit.isMale)

            this.showOutfitList()
        })

        this.wrapOutfit = scene.add.text(scene.scale.width-100, -230, 'Wrap Outfit', {
            fontSize: 40, color: '#000000', fontStyle: 'bold', fontFamily: 'PixelFont',
            stroke: '#ffffff', strokeThickness: 4
        }).setOrigin(1, 0.5).setInteractive().on('pointerdown', () => {
            this.isWrapMode = !this.isWrapMode

            this.showOutfitList()
        })

        this.add([this.image, this.background, this.changeGender, this.wrapOutfit])

        for(let i=0; i<4; i++){
            const x = scene.scale.width/2 + 280 * i - 440
            const headerText = scene.add.text(x, -320, Object.keys(this.outfitList.male)[i], {
                fontSize: 40, color: '#000000', fontStyle: 'bold', fontFamily: 'PixelFont'
            })
            headerText.setOrigin(0.5, 0.5)
            this.add(headerText)
        }

        this.hairColors = []
        const colors = [0xcc6666, 0x66cc66, 0x6666cc, 0xcccc66, 0xcc66cc, 0x66ffff, 0xffffff, 0x888888]

        for(let i=0; i<4; i++){
            for(let j=0; j<4; j++){
                if(!colors[i*4+j]) continue

                const x = 120 + 72 * j
                const y = 72 * i - 280
                const hairColor = scene.add.rectangle(x, y, 64, 64, colors[i*4+j])
                hairColor.setStrokeStyle(4, 0x000000)

                if(this.player.sprite.outfit.color == colors[i*4+j]) hairColor.setStrokeStyle(4, 0xffffff)

                hairColor.setInteractive()
                hairColor.on('pointerdown', () => {
                    player.sprite.changeHairColor(colors[i*4+j])
                    this.scene.socket.emit('changeOutfit', 'color', colors[i*4+j])

                    this.hairColors.forEach(v => {
                        v.setStrokeStyle(4, 0x000000)
                    })
                    hairColor.setStrokeStyle(4, 0xffffff)
                })

                this.hairColors.push(hairColor)
                this.add(hairColor)
            }
        }

        this.showOutfitList()
    }

    showOutfitList(){
        if(!this.buttons) this.buttons = []
        else{
            this.buttons.forEach(v => v.destroy())
            this.buttons = []
        }

        const genderKey = this.player.sprite.outfit.isMale ? 'male' : 'female'

        Object.keys(this.outfitList[genderKey]).forEach((key, index) => {
            if(key != 'hair' && key != 'face' && key != 'body' && key != 'leg') return

            let j = 0

            for(let i = 0; i < this.outfitList[genderKey][key].length; i++){
                if(!this.ownedOutfits.includes(this.outfitList[genderKey][key][i]+'-'+key+'-'+genderKey)){
                    j++
                    continue
                }

                const x = this.scene.scale.width/2 + 280 * index - 440
                const y = 36 * (i-j) - 260
                const button = this.scene.add.text(x, y, this.outfitList[genderKey][key][i], {
                    fontSize: 32, color: '#000000', fontFamily: 'PixelFont',
                    stroke: '#ffffff', strokeThickness: 4
                }).setOrigin(0.5, 0.5).setInteractive().setName(key)

                if(this.player.sprite.outfit[key] == this.outfitList[genderKey][key][i]){
                    button.setStroke('#00ff00', 4)
                }

                if(this.isWrapMode){
                    button.setStroke('#ffffff', 4)
                    this.scene.tweens.add({
                        targets: button,
                        alpha: 0.2,
                        duration: 500,
                        yoyo: true,
                        ease: 'Sine.easeInOut',
                        repeat: -1
                    })
                    button.on('pointerup', () => {
                        this.scene.socket.emit('wrapOutfit', key, this.outfitList[genderKey][key][i])
                    })
                }
                else{
                    button.on('pointerup', () => {
                        this.changeOutfit(key, i)

                        this.buttons.forEach(v => {
                            if(v.name != key) return
                            v.setStroke('#ffffff', 4)
                        })
                        button.setStroke('#00ff00', 4)
                    })
                }

                this.buttons.push(button)
                this.add(button)
            }
        })
    }

    setVisible(value: boolean): this {
        super.setVisible(value)
        
        if(value) this.onOpen({ x: this.player.x, y: this.player.y })
        else this.onClose()

        this.isWrapMode = false

        this.showOutfitList()

        return this
    }

    private changeOutfit(key: string, index: number) {
        if(key != 'hair' && key != 'face' && key != 'body' && key != 'leg') return

        const genderKey = this.player.sprite.outfit.isMale ? 'male' : 'female'
        this.player.sprite.changeOutfit(key, this.outfitList[genderKey][key][index])
        this.scene.socket.emit('changeOutfit', key, this.outfitList[genderKey][key][index])
    }

    onOpen(pos: { x: number, y: number }) { pos; }

    onClose(){}
}
