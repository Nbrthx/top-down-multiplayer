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
    taskTextDefaultY: number = -270;

    buttonGo: Phaser.GameObjects.NineSlice;
    buttonTextGo: Phaser.GameObjects.Text;
    buttonBack: Phaser.GameObjects.NineSlice;
    buttonTextBack: Phaser.GameObjects.Text;
    warningText: Phaser.GameObjects.Text;

    constructor(scene: GameUI) {
        super(scene, 0, scene.scale.height);
        
        this.scene = scene;
        this.scene.add.existing(this);

        this.setVisible(false);

        this.image = scene.add.nineslice(scene.scale.width/2, -200, 'box-nineslice', 0, scene.scale.width/4, 100, 16, 16, 16, 16)
        this.image.setScale(4)

        this.background = scene.add.rectangle(scene.scale.width/2, -scene.scale.height/2, scene.scale.width, scene.scale.height)
        this.background.setInteractive()

        const contentBox = scene.add.rectangle(scene.scale.width/2, scene.scale.height-145, scene.scale.width, 250, 0xffffff).setVisible(false)

        this.npcName = scene.add.text(80, -310, '', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#444444',
            letterSpacing: 2
        })
        this.npcName.setOrigin(0, 0.5)

        this.npcBiography = scene.add.text(80, -280, '', {
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
            fontFamily: 'PixelFont', fontSize: 24, color: '#000000',
            letterSpacing: 1
        })
        this.taskText.setOrigin(0, 0)
        this.taskText.setWordWrapWidth(scene.scale.width/2 - 160, true)
        this.taskText.setMask(contentBox.createGeometryMask())
        this.taskText.setInteractive({ draggable: true })
        this.taskText.on('wheel', (pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
            pointer.event.preventDefault()

            this.taskText.y -= deltaY*0.1
            if(this.taskText.y > this.taskTextDefaultY) this.taskText.y = this.taskTextDefaultY
            if(this.taskText.y < -260 - this.taskText.height + 190) this.taskText.y = -260 - this.taskText.height + 190
        })
        this.taskText.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if(!pointer.isDown) return
            pointer.event.preventDefault()

            this.taskText.y += pointer.y - pointer.prevPosition.y
            if(this.taskText.y > this.taskTextDefaultY) this.taskText.y = this.taskTextDefaultY
            if(this.taskText.y < -260 - this.taskText.height + 190) this.taskText.y = -260 - this.taskText.height + 190
        })

        this.warningText = scene.add.text(scene.scale.width/3+80, -270, '', {
            fontFamily: 'PixelFont', fontSize: 24, color: '#cc0000',
            letterSpacing: 1, stroke: '#e0e0e0', strokeThickness: 4
        })
        this.warningText.setOrigin(0, 0)
        this.warningText.setWordWrapWidth(scene.scale.width/2 - 160, true)

        this.buttonGo = scene.add.nineslice(scene.scale.width-200, -300, 'button-nineslice', 0, 48, 16, 4, 4, 4, 4)
        this.buttonGo.setScale(4)
        this.buttonGo.setInteractive();

        this.buttonTextGo = scene.add.text(this.buttonGo.x, this.buttonGo.y, 'Go', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000'
        }).setOrigin(0.5, 0.5);

        this.buttonBack = scene.add.nineslice(scene.scale.width-200, -220, 'button-nineslice', 0, 48, 16, 4, 4, 4, 4)
        this.buttonBack.setScale(4)
        this.buttonBack.setInteractive();
        this.buttonBack.on('pointerdown', () => {
            this.buttonBack.setTint(0x888888);
            setTimeout(() => {
                this.setVisible(false);
                this.onClose()

                this.buttonBack.clearTint();
            }, 100);
        });

        this.buttonTextBack = scene.add.text(this.buttonBack.x, this.buttonBack.y, 'Back', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000'
        }).setOrigin(0.5, 0.5);

        this.add([
            this.background,
            this.image,
            this.npcName, this.npcBiography,
            splitter,
            this.headerText, this.taskText,
            this.warningText,
            this.buttonGo, this.buttonTextGo,
            this.buttonBack, this.buttonTextBack
        ]);
    }

    setText(config: {
        npcId: string,
        npcName: string,
        biography: string,
        header: string,
        text: string,
        warn: string
        pos: { x: number, y: number }
        isHaveOtherQuest: boolean
        progressState: number
    }) {
        if(!this.headerText || !this.taskText) return;
        if(config.header.length > 30) config.header = config.header.substring(0, 30) + '...';
        if(config.text.length > 200) config.text = config.text.substring(0, 200) + '...';

        this.setVisible(true);

        this.npcName.setText(config.npcName);
        this.npcBiography.setText(config.biography);

        this.headerText.setText(config.header);
        this.taskText.setText(config.text);

        if(config.isHaveOtherQuest || config.progressState != 0){
            this.taskTextDefaultY = -236
            this.taskText.setY(-236)
        }
        else{
            this.taskTextDefaultY = -270
            this.taskText.setY(-270)
        }

        this.warningText.setText(config.warn)

        if(config.progressState == 0) this.buttonTextGo.setText('Accept')
        else if(config.progressState == 1) this.buttonTextGo.setText('Decline')
        else this.buttonTextGo.setText('Complete')

        if(config.header == ''){
            this.buttonGo.setVisible(false)
            this.buttonTextGo.setVisible(false)
            this.buttonBack.setY(this.buttonGo.y)
            this.buttonTextBack.setY(this.buttonTextGo.y)
            this.headerText.setText('No Quest Yet')
            this.taskText.setText('')
        }
        else{
            this.buttonGo.setVisible(true)
            this.buttonTextGo.setVisible(true)
            this.buttonBack.setY(this.buttonGo.y + 80)
            this.buttonTextBack.setY(this.buttonTextGo.y + 80)
        }

        if(config.progressState == 1) this.warningText.setColor('#cc0000') // RED
        else this.warningText.setColor('#00aa22') // GREEN

        this.buttonGo.on('pointerdown', () => {
            this.buttonGo.off('pointerdown')
            this.buttonGo.setTint(0x888888);
            setTimeout(() => {
                this.setVisible(false);

                console.log(config)

                if(config.progressState == 0) this.scene.socket.emit('acceptQuest', config.npcId)
                else if(config.progressState == 1) this.scene.socket.emit('declineQuest')
                else this.scene.socket.emit('completeQuest')

                this.onClose()
                this.buttonGo.clearTint();
            }, 100);
        });

        this.onOpen(config.pos)
    }

    destroy(){
        super.destroy(true);
    }

    onOpen(pos: { x: number, y: number }) { pos; }

    onClose(){}
}