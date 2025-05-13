import { Server, Socket } from 'socket.io';
import { GameManager, InputData } from './GameManager';
import { Server as HTTPServer } from 'http'

interface Accounts{
    username: string,
    xp: number,
    inventory: {
        id: string
        name: string
    }[]
}

export class SocketManager {

    private io: Server;
    private gameManager: GameManager;
    private accounts: Accounts[];
    private authedId: Map<string, string>;

    constructor(server: HTTPServer, accounts: Accounts[], authedId: Map<string, string>) {
        this.io = new Server(server);
        this.gameManager = new GameManager(this.io);
        this.accounts = accounts
        this.authedId = authedId

        this.io.on('connection', this.setupSocketListeners.bind(this))
    }

    private setupSocketListeners(socket: Socket): void {

        socket.on('joinGame', worldId => {
            worldId;
            const world = this.gameManager.getWorld('world1')
            world?.addPlayer(socket.id);
            
            socket.emit('joinGame', world?.players.map(v => v.id), this.getAccountData(socket.id))
            socket.broadcast.emit('playerJoined', socket.id);
        })

        socket.on('playerInput', (worldId: string, input: InputData) => {
            this.gameManager.handleInput(socket.id, worldId, input);
        });

        socket.on('ping', (callback) => {
            callback()
        })

        socket.on('disconnect', () => {
            socket.broadcast.emit('playerLeft', socket.id);
            this.gameManager.getWorld('world1')?.removePlayer(socket.id);
            this.removeAuthedId(socket.id)
        });
        
    }

    getAccountData(id: string){
        if(!this.authedId.has(id)) return null

        const username = this.authedId.get(id) as string

        return this.accounts.find(v => v.username == username)
    }

    setAccountData(id: string, data: Accounts){
        if(!this.authedId.has(id)) return

        const username = this.authedId.get(id) as string

        const index = this.accounts.findIndex(v => v.username == username)
        this.accounts[index] = data
    }

    removeAuthedId(id: string){
        this.authedId.delete(id)
    }
}
