import { GameUI } from "../../scenes/GameUI";

interface Task {
    type: 'kill' | 'collect' | 'deliver' | 'explore' | 'craft'
    target: string
    amount: number
}

export interface QuestConfig{
    id: string
    name: string
    description: string
    taskInstruction: string
    task: Task[]
    reward: { xp: number, item?: [string, number][], gold?: number }
    repeatable?: boolean
}

export class QuestUI extends Phaser.GameObjects.Container {

    scene: GameUI;

    image: Phaser.GameObjects.NineSlice;
    background: Phaser.GameObjects.Rectangle;

    npcName: Phaser.GameObjects.Text;
    npcBiography: Phaser.GameObjects.Text;

    headerText: Phaser.GameObjects.Text;
    taskText: Phaser.GameObjects.Text;

    buttonGo: Phaser.GameObjects.NineSlice;
    buttonTextGo: Phaser.GameObjects.Text;
    buttonCancel: Phaser.GameObjects.NineSlice;
    buttonTextCancel: Phaser.GameObjects.Text;

    constructor(scene: GameUI) {
        super(scene, 0, scene.scale.height);
        
        this.scene = scene;
        this.scene.add.existing(this);

        this.setVisible(false);

        this.image = scene.add.nineslice(scene.scale.width/2, -200, 'box-nineslice', 0, scene.scale.width/4, 100, 16, 16, 16, 16)
        this.image.setScale(4)

        this.background = scene.add.rectangle(scene.scale.width/2, -scene.scale.height/2, scene.scale.width, scene.scale.height)
        this.background.setInteractive()

        this.npcName = scene.add.text(80, -310, '', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#444444',
            letterSpacing: 2
        })
        this.npcName.setOrigin(0, 0.5)

        this.npcBiography = scene.add.text(80, -270, '', {
            fontFamily: 'PixelFont', fontSize: 24, color: '#444444',
            letterSpacing: 1
        })
        this.npcBiography.setOrigin(0, 0)
        this.npcBiography.setWordWrapWidth(scene.scale.width/3 - 160, true)

        const splitter = scene.add.rectangle(scene.scale.width/3, -200, 4, 260, 0x000000)

        this.headerText = scene.add.text(scene.scale.width/3+80, -310, '', {
            fontFamily: 'PixelFont', fontSize: 48, color: '#000000',
            letterSpacing: 1
        })
        this.headerText.setOrigin(0, 0.5)

        this.taskText = scene.add.text(scene.scale.width/3+80, -260, '', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000',
            letterSpacing: 1
        })
        this.taskText.setOrigin(0, 0)
        this.taskText.setWordWrapWidth(scene.scale.width/2 - 160, true)

        this.buttonGo = scene.add.nineslice(scene.scale.width-200, -300, 'button-nineslice', 0, 48, 16, 4, 4, 4, 4)
        this.buttonGo.setScale(4)
        this.buttonGo.setInteractive();

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
            this.npcName, this.npcBiography,
            splitter,
            this.headerText, this.taskText,
            this.buttonGo, this.buttonTextGo,
            this.buttonCancel, this.buttonTextCancel,
        ]);
    }

    setText(npcId: string, npcName: string, biography: string, header: string, text: string, pos: { x: number, y: number }) {
        if(!this.headerText || !this.taskText) return;
        if(header.length > 30) header = header.substring(0, 30) + '...';
        if(text.length > 200) text = text.substring(0, 200) + '...';

        this.setVisible(true);

        this.npcName.setText(npcName);
        this.npcBiography.setText(biography);

        this.headerText.setText(header);
        this.taskText.setText(text);

        this.buttonGo.on('pointerdown', () => {
            this.buttonGo.setTint(0x888888);
            setTimeout(() => {
                this.setVisible(false);
                this.scene.socket.emit('acceptQuest', npcId)

                this.onClose()
                this.buttonGo.clearTint();
            }, 100);
        });

        this.onOpen(pos)
    }

    destroy(){
        super.destroy(true);
    }

    onOpen(pos: { x: number, y: number }) { pos; }

    onClose(){}
}