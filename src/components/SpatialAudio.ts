import p from 'planck'

export interface SpatialSound{
    sound: Phaser.Sound.WebAudioSound | null
    isPlay: boolean
    playSound: (x?: number, y?: number, isLoud?: boolean, isWait?: boolean) => void
}

export class SpatialAudio{

    scene: Phaser.Scene;
    context: AudioContext
    pBody?: p.Body

    constructor(scene: Phaser.Scene, listenerBody?: p.Body){
        this.scene = scene
        this.pBody = listenerBody

        this.scene.sound.pauseOnBlur = false

        this.context = (scene.sound as Phaser.Sound.WebAudioSoundManager).context
    }

    addListenerBody(body: p.Body){
        this.pBody = body
    }

    addSound(soundName: string){
        const hasAudio = this.scene.cache.audio.has(soundName)
        const sound = hasAudio ? this.scene.sound.add(soundName) as Phaser.Sound.WebAudioSound : null
        const audio: SpatialSound = {
            sound: sound,
            isPlay: false,
            playSound: (x?: number, y?: number, isLoud?: boolean, isWait = true) => {
                if(!audio.sound) return
                if(audio.isPlay && isWait) return
                audio.isPlay = true

                const listener = this.pBody?.getPosition()
                
                const panner = new PannerNode(this.context, {
                    panningModel: 'HRTF',
                    positionX: (x || 0)/2 - (listener?.x || x || 0)/2,
                    positionY: (y || 0)/2 - (listener?.y || y || 0)/2,
                    positionZ: !isLoud && (listener?.x == x && listener?.y == y) ? 3 : 0
                });
                const source = this.context.createBufferSource();
                source.buffer = audio.sound.audioBuffer;
                source.connect(panner).connect(this.context.destination);
                source.start();                

                source.onended = () => {
                    audio.isPlay = false
                }
            }
        }
        return audio
    }
}