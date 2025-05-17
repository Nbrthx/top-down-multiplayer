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

        socket.on('joinGame', worldId => {
            worldId;

            const account = this.getAccountData(socket.id)
            if(!account) return

            const world = this.gameManager.getWorld('world1')
            world?.addPlayer(socket.id, account);
            
            socket.emit('joinGame', account, world?.players.map(v => {
                return {
                    id: v.id,
                    hotItems: v.inventory.hotItems
                }
            }))
            socket.broadcast.emit('playerJoined', socket.id, account.inventory.hotItems);
        })

        socket.on('playerInput', (worldId: string, input: InputData) => {
            this.gameManager.handleInput(socket.id, worldId, input);
        });

        socket.on('updateInventory', (_worldId: string, swap: {
            index: number,
            isHotbar: boolean,
            index2: number
            isToHotbar: boolean
        }) => {
            const player = this.gameManager.getWorld('world1')?.players.find(v => v.id == socket.id)
            if(!player) return

            player.inventory.swapItem(swap.index, swap.isHotbar, swap.index2, swap.isToHotbar)

            socket.emit('updateInventory', {
                items: player.inventory.items,
                hotItems: player.inventory.hotItems
            })
            socket.broadcast.emit('otherUpdateInventory', socket.id, player.inventory.hotItems)
        })

        socket.on('updateHotbar', (_worldId: string, index: number) => {
            const player = this.gameManager.getWorld('world1')?.players.find(v => v.id == socket.id)
            if(!player) return

            player.inventory.setActiveIndex(index)
            socket.broadcast.emit('otherUpdateHotbar', socket.id, index)
        })

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

    removeAuthedId(id: string){
        this.authedId.delete(id)
    }
}
