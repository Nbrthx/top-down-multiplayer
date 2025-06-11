import { GameUI } from "../../scenes/GameUI";

export class QuestUI extends Phaser.GameObjects.Container {

    image: Phaser.GameObjects.NineSlice;
    background: Phaser.GameObjects.Rectangle;

    npcName: Phaser.GameObjects.Text;
    npcDescription: Phaser.GameObjects.Text;

    headerText: Phaser.GameObjects.Text;
    taskText: Phaser.GameObjects.Text;

    buttonGo: Phaser.GameObjects.NineSlice;
    buttonTextGo: Phaser.GameObjects.Text;
    buttonCancel: Phaser.GameObjects.NineSlice;
    buttonTextCancel: Phaser.GameObjects.Text;

    constructor(scene: GameUI) {
        super(scene, 0, scene.scale.height);
        
        this.scene.add.existing(this);

        this.setVisible(false);

        this.image = scene.add.nineslice(scene.scale.width/2, -200, 'box-nineslice', 0, scene.scale.width/4, 100, 16, 16, 16, 16)
        this.image.setScale(4)

        this.background = scene.add.rectangle(scene.scale.width/2, -scene.scale.height/2, scene.scale.width, scene.scale.height)
        this.background.setInteractive()

        this.npcName = scene.add.text(80, -320, 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWW', {
            fontFamily: 'PixelFont', fontSize: 48, color: '#000000', fontStyle: 'bold',
            letterSpacing: 2
        })
        this.npcName.setOrigin(0, 0.5)

        this.npcDescription = scene.add.text(80, -270, 'lorem ipsum dolor si amet adasdjas ajfhf asjghsfgad adhajdas kadhjsad', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000',
            letterSpacing: 1
        })
        this.npcDescription.setOrigin(0, 0)
        this.npcDescription.setWordWrapWidth(scene.scale.width/2 - 160, true)

        const splitter = scene.add.rectangle(scene.scale.width/2, -200, 4, 300, 0x000000)

        this.headerText = scene.add.text(scene.scale.width/2+80, -320, 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWW', {
            fontFamily: 'PixelFont', fontSize: 48, color: '#000000',
            letterSpacing: 1
        })
        this.headerText.setOrigin(0, 0.5)

        this.taskText = scene.add.text(scene.scale.width/2+80, -270, 'lorem ipsum dolor si amet adasdjas ajfhf asjghsfgad adhajdas kadhjsad', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000',
            letterSpacing: 1
        })
        this.taskText.setOrigin(0, 0)
        this.taskText.setWordWrapWidth(scene.scale.width/4 - 160, true)

        this.buttonGo = scene.add.nineslice(scene.scale.width-200, -300, 'button-nineslice', 0, 48, 16, 4, 4, 4, 4)
        this.buttonGo.setScale(4)
        this.buttonGo.setInteractive();
        this.buttonGo.on('pointerdown', () => {
            this.buttonGo.setTint(0x888888);
            setTimeout(() => {
                this.scene.registry.set('questAccepted', true);
                this.setVisible(false);

                this.onClose()
                this.buttonGo.clearTint();
            }, 100);
        });

        this.buttonTextGo = scene.add.text(this.buttonGo.x, this.buttonGo.y, 'Go', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000'
        }).setOrigin(0.5, 0.5);

        this.buttonCancel = scene.add.nineslice(scene.scale.width-200, -220, 'button-nineslice', 0, 48, 16, 4, 4, 4, 4)
        this.buttonCancel.setScale(4)
        this.buttonCancel.setInteractive();
        this.buttonCancel.on('pointerdown', () => {
            this.buttonCancel.setTint(0x888888);
            setTimeout(() => {
                this.setVisible(false);
                this.onClose()

                this.buttonCancel.clearTint();
            }, 100);
        });

        this.buttonTextCancel = scene.add.text(this.buttonCancel.x, this.buttonCancel.y, 'Cancel', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000'
        }).setOrigin(0.5, 0.5);

        this.add([
            this.background,
            this.image,
            this.npcName, this.npcDescription,
            splitter,
            this.headerText, this.taskText,
            this.buttonGo, this.buttonTextGo,
            this.buttonCancel, this.buttonTextCancel,
        ]);
    }

    setText(header: string, text: string, pos: { x: number, y: number }) {
        if(!this.headerText || !this.taskText) return;
        if(header.length > 30) header = header.substring(0, 30) + '...';
        if(text.length > 200) text = text.substring(0, 200) + '...';

        this.setVisible(true);

        this.headerText.setText(header);
        this.taskText.setText(text);

        this.onOpen(pos)
    }

    destroy(){
        super.destroy(true);
    }

    onOpen(pos: { x: number, y: number }) { pos; }

    onClose(){}
}