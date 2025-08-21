export class TextBox extends Phaser.GameObjects.Text {
    itr: number;
    timer: Phaser.Time.TimerEvent;
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, '', {
            fontFamily: 'PixelFont', fontSize: 38,
            color: '#fff', strokeThickness: 8, stroke: '#000', letterSpacing: 2
        });
        this.scene = scene;
        this.scene.add.existing(this)
        this.setResolution(5)
        
        this.itr = 0;

        this.setOrigin(0.5, 0.5);
        this.setDepth(999)
    }
//
    writeText(preText = ''){
        if(this.timer) this.timer.destroy()
        this.itr = 0
        this.tick(preText)
    }

    tick(preText: string){
        if(this.timer) this.timer.destroy()
        if (this.itr <= preText.length) {
            this.text = preText.substring(0, this.itr)
            this.itr++;
            this.timer = this.scene.time.addEvent({
                delay: 33,
                callback: () => this.tick(preText),
            });
        }
        else{
            this.timer = this.scene.time.addEvent({
                delay: 4000,
                callback: () => {
                    this.itr = 0
                    this.text = ''
                }
            });
        }
    }

    destroy(){
        super.destroy()
    }
}