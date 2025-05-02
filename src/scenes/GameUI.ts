import { io, Socket } from 'socket.io-client'

export default class GameUI extends Phaser.Scene {

    socket: Socket
    pingText: Phaser.GameObjects.Text

    constructor(){
        super('GameUI')

        this.socket = io('https://3000-idx-top-down-multiplayer-1745980442747.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev', {
            transports: ['websocket']
        })
    }

    create(){

        this.pingText = this.add.text(100, 100, 'Ping: 0ms')

        setInterval(() => {
            const then = Date.now()
            this.socket.emit('ping', () => {
                const now = Date.now()
                this.pingText.setText('Ping: '+ (now-then)+'ms')
            })
        }, 1000)
    }
}