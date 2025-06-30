export class AlertBoxUI extends Phaser.GameObjects.Container {
    private box: Phaser.GameObjects.NineSlice;
    private text: Phaser.GameObjects.Text;
    private buttonClose: Phaser.GameObjects.Text;
    private buttonOk: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        scene.add.existing(this);

        const bg = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.4);
        bg.setInteractive();

        this.box = scene.add.nineslice(0, 0, 'button-nineslice', 0, 128, 64, 4, 4, 4, 4);
        this.box.setScale(4);
        this.box.setAlpha(0.6)

        this.text = scene.add.text(-200, -80, '', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#000000'
        }).setOrigin(0);
        this.text.setWordWrapWidth(400, true);

        this.buttonClose = scene.add.text(100, 80, 'OK', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#cc0000',
            stroke: '#ffffff', strokeThickness: 2
        }).setOrigin(0.5, 0.5);
        this.buttonClose.setInteractive();

        this.buttonClose.on('pointerup', () => {
            this.setVisible(false);
        })

        this.buttonOk = scene.add.text(180, 80, 'OK', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#008800',
            stroke: '#ffffff', strokeThickness: 2
        }).setOrigin(0.5, 0.5);
        this.buttonOk.setInteractive();

        this.add([bg, this.box, this.text, this.buttonClose, this.buttonOk]);
    }

    setAlert(text: string, isConfirm: boolean = false, callback?: () => void) {
        this.setVisible(true);
        this.text.setText(text);
        
        if (!isConfirm) {
            this.buttonOk.setVisible(false)
            this.buttonClose.setX(180)
            this.buttonClose.setText('OK')
        }
        else{
            this.buttonOk.setVisible(true)
            this.buttonClose.setX(100)
            this.buttonClose.setText('Cancel')

            this.buttonOk.on('pointerup', () => {
                this.setVisible(false);
                callback?.()

                this.buttonOk.off('pointerup')
            })
        }
    }
}
