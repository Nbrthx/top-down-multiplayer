import { Server, Socket } from 'socket.io';
import { GameManager, InputData } from './GameManager';
import { Server as HTTPServer } from 'http'
import { Account } from './server';
import { QuestConfig, Quests } from './components/Quests';

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
            if(!input) return
            if(typeof input.dir.x !== 'number' && typeof input.dir.y !== 'number') return
            if(typeof input.attackDir.x !== 'number' && typeof input.attackDir.y !== 'number') return

            this.gameManager.handleInput(socket.id, input);
        });

        socket.on('swapInventory', (swap: {
            index: number,
            index2: number
        }) => {
            if(!Number.isInteger(swap.index) && !Number.isInteger(swap.index2)) return

            const world = this.gameManager.getPlayerWorld(socket.id)
            if(!world) return

            const player = world.players.find(v => v.uid == socket.id)
            if(!player) return

            player.inventory.swapItem(swap.index, swap.index2)

            socket.emit('updateInventory', player.inventory.items)
            socket.broadcast.to(world.id).emit('otherUpdateInventory', socket.id, player.inventory.items)
        })

        socket.on('setHotbarIndex', (index: number) => {
            if(!Number.isInteger(index)) return

            const player = this.getPlayer(socket.id)
            if(!player) return

            player.inventory.setActiveIndex(index)
            socket.broadcast.to(player.scene.id).emit('otherUpdateHotbar', socket.id, index)
        })

        socket.on('dropItem', (index: number, dir: { x: number, y: number }, quantity?: number) => {
            if(!Number.isInteger(index) && typeof dir.x !== 'number' && typeof dir.y !== 'number') return

            const world = this.gameManager.getPlayerWorld(socket.id)
            if(!world) return

            world.playerDropItem(socket.id, index, dir, quantity)
        })

        socket.on('chat', msg => {
            if(typeof msg !== 'string' && msg.length > 64) return

            const player = this.getPlayer(socket.id)
            if(!player) return

            this.io.to(player.scene.id).emit('chat', {
                id: socket.id,
                username: player.account.username,
                msg: msg
            })
        })

        socket.on('acceptQuest', (npcId: string) => {
            if(typeof npcId !== 'string') return

            const player = this.getPlayer(socket.id)
            if(!player) return

            const quest = Quests.getQuestByNpcId(npcId, player.account.questCompleted)
            if(!quest) return

            console.log('Quest accepted:', quest.config.id)

            player.questInProgress = quest
            player.account.questInProgress = [npcId, quest.taskProgress]

            player.questInProgress.onProgress = taskProgress => {
                player.account.questInProgress = [npcId, taskProgress];
            }

            player.questInProgress.onComplete = (xp, item?, gold?) => {
                player.account.questCompleted.push(quest.config.id);
                player.account.xp += xp || 0;
                player.account.gold += gold || 0;
                if(item && item.length > 0){
                    item.forEach(([itemName, itemQuantity]) => {
                        player.inventory.addItem(itemName, itemQuantity);
                    });
                }
                player.account.questInProgress = undefined
            }
        })

        socket.on('getQuestData', (npcId: string, callback: (quest: QuestConfig) => void) => {
            if(typeof npcId !== 'string') return

            const player = this.getPlayer(socket.id)
            if(!player) return

            const quest = Quests.getQuestByNpcId(npcId, player.account.questCompleted)
            if(!quest) return

            callback(quest.config || null)
        })

        socket.on('ping', (callback) => {
            callback()
        })

        socket.on('disconnect', () => {
            this.gameManager.getPlayerWorld(socket.id)?.removePlayer(socket.id);
            this.removeAuthedId(socket.id)
        });
        
    }

    getPlayer(id: string){
        return this.gameManager.getPlayerWorld(id)?.players.find(v => v.uid == id)
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
