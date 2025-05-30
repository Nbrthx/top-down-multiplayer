import { Server, Socket } from 'socket.io';
import { GameManager, InputData } from './GameManager';
import { Server as HTTPServer } from 'http'
import { Account } from './server';

export class SocketManager {

    private io: Server;
    private gameManager: GameManager;
    private accounts: Account[];
    private authedId: Map<string, string>;

    constructor(server: HTTPServer, accounts: Account[], authedId: Map<string, string>) {
        this.io = new Server(server);
        this.gameManager = new GameManager(this.io);
        this.accounts = accounts
        this.authedId = authedId

        this.io.on('connection', this.setupSocketListeners.bind(this))
    }

    private setupSocketListeners(socket: Socket): void {

        socket.on('joinGame', () => {
            const account = this.getAccountData(socket.id)
            if(!account) return

            const world = this.gameManager.getWorld('test')
            world?.addPlayer(socket.id, account);
        })

        socket.on('playerInput', (input: InputData) => {
            this.gameManager.handleInput(socket.id, input);
        });

        socket.on('updateInventory', (swap: {
            index: number,
            index2: number
        }) => {
            const world = this.gameManager.getPlayerWorld(socket.id)
            if(!world) return

            const player = world.players.find(v => v.id == socket.id)
            if(!player) return

            player.inventory.swapItem(swap.index, swap.index2)

            socket.emit('updateInventory', player.inventory.items)
            socket.broadcast.to(world.id).emit('otherUpdateInventory', socket.id, player.inventory.items)
        })

        socket.on('updateHotbar', (index: number) => {
            const player = this.gameManager.getPlayerWorld(socket.id)?.players.find(v => v.id == socket.id)
            if(!player) return

            player.inventory.setActiveIndex(index)
            socket.broadcast.to(player.scene.id).emit('otherUpdateHotbar', socket.id, index)
        })

        socket.on('chat', msg => {
            if(typeof msg !== 'string') return
            const player = this.gameManager.getPlayerWorld(socket.id)?.players.find(v => v.id == socket.id)
            if(!player) return

            this.io.to(player.scene.id).emit('chat', {
                id: socket.id,
                username: player.account.username,
                msg: msg
            })
        })

        socket.on('ping', (callback) => {
            callback()
        })

        socket.on('disconnect', () => {
            this.gameManager.getPlayerWorld(socket.id)?.removePlayer(socket.id);
            this.removeAuthedId(socket.id)
        });
        
    }

    getAccountData(id: string){
        if(!this.authedId.has(id)) return null

        const username = this.authedId.get(id) as string

        return this.accounts.find(v => v.username == username)
    }

    removeAuthedId(id: string){
        this.authedId.delete(id)
    }
}
