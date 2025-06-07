import { Stats } from "../../components/Stats";
import { GameUI } from "../../scenes/GameUI";

export class StatsUI extends Phaser.GameObjects.Container {

    image: Phaser.GameObjects.Image;
    xpBar: Phaser.GameObjects.Rectangle;
    xpText: Phaser.GameObjects.Text;
    levelText: Phaser.GameObjects.Text;
    gcText: Phaser.GameObjects.Text;

    constructor(scene: GameUI) {
        super(scene, 0, scene.scale.height);
        
        this.scene.add.existing(this);

        this.image = scene.add.image(40, -20, 'stats')
        this.image.setOrigin(0, 1).setScale(4);

        this.levelText = scene.add.text(85, -52, '0', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#ffffff'
        }).setOrigin(0.5);

        this.xpBar = scene.add.rectangle(110, -52, 140, 8, 0xaa55bb)
        this.xpBar.setOrigin(0, 0.5).setScale(4)

        this.xpText = scene.add.text(380, -52, '0/0', {
            fontFamily: 'PixelFont', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.gcText = scene.add.text(136, -110, '0.0000', {
            fontFamily: 'PixelFont', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0, 0.5);

        this.add([this.image, this.levelText, this.xpBar, this.xpText, this.gcText])
    }

    update(stats: Stats){
        this.levelText.setText(stats.getLevel()+'')
        this.xpBar.setSize(stats.getXp()/stats.getNextXp()*140, 8)
        this.xpText.setText(stats.getXp()+'/'+stats.getNextXp())
    }
}