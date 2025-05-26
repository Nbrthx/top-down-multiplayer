import p from 'planck'

export interface SpatialSound{
    audioBuffer: AudioBuffer
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

        this.context = (scene.sound as Phaser.Sound.WebAudioSoundManager).context
    }

    addListenerBody(body: p.Body){
        this.pBody = body
    }

    addSound(soundName: string){
        const audio: SpatialSound = {
            audioBuffer: (this.scene.sound.add(soundName) as Phaser.Sound.WebAudioSound).audioBuffer,
            isPlay: false,
            playSound: (x?: number, y?: number, isLoud?: boolean, isWait = true) => {
                if(audio.isPlay) return
                if(isWait) audio.isPlay = true

                const listener = this.pBody?.getPosition()
                
                const panner = new PannerNode(this.context, {
                    panningModel: 'HRTF',
                    positionX: (x || 0) - (listener?.x || x || 0),
                    positionY: (y || 0) - (listener?.y || y || 0),
                    positionZ: !isLoud && (listener?.x == x && listener?.y == y) ? 5 : 0
                });
                const source = this.context.createBufferSource();
                source.buffer = audio.audioBuffer;
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