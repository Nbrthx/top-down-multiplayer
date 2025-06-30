import { Server, Socket } from 'socket.io';
import { GameManager, InputData } from './GameManager';
import { Server as HTTPServer } from 'http'
import { Account, Item } from './server';
import { QuestConfig, Quests } from './components/Quests';

interface OutfitList {
    male: {
        hair: string[],
        face: string[],
        body: string[],
        leg: string[]
    },
    female: {
        hair: string[],
        face: string[],
        body: string[],
        leg: string[]
    }
}

const outfitList: OutfitList = {
    male: {
        hair: ['basic', 'spread', 'short', 'blangkon', 'bodied', 'long'],
        face: ['basic', 'old', 'green-eye'],
        body: ['basic', 'black', 'brown', 'red', 'white-shirt'],
        leg: ['basic', 'grey', 'brown']
    },
    female: {
        hair: ['basic', 'bodied', 'ponytail', 'short', 'long'],
        face: ['basic', 'blue-eye'],
        body: ['basic', 'black', 'grey', 'pink', 'barista'],
        leg: ['basic', 'skirt', 'brown']
    }
}

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

            const world = this.gameManager.getWorld('map1')
            world?.addPlayer(socket.id, account);
        })

        socket.on('confirmChangeWorld', () => {
            const player = this.getPlayer(socket.id)
            if(!player) return

            const worldId = this.gameManager.playerChangeWorld.get(socket.id)
            if(!worldId) return

            const world = this.gameManager.getWorld(worldId)
            if(!world) return

            if(player.stats.getLevel() < world.requiredLevel) return

            player.scene.removePlayer(socket.id)
            world.addPlayer(socket.id, player.account, player.scene.id == 'duel' ? 'spawn' : player.scene.id)

            this.gameManager.playerChangeWorld.delete(socket.id)
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

            const command = msg.split(' ')
            if(command[0] == '/duel') {
                const player2Id = this.getIdByUsername(command[1])
                if(!player2Id && player2Id != socket.id) return

                console.log(player2Id)

                const player2 = this.getPlayer(player2Id)
                if(!player2) return

                this.gameManager.duelRequest.set(player2.uid, player.uid)

                setTimeout(() => {
                    this.gameManager.duelRequest.delete(player2.uid)
                }, 30000)

                this.io.to(player2.uid).emit('duelRequest', player.account.username, player.stats.getLevel())
                return
            }

            this.io.to(player.scene.id).emit('chat', {
                id: socket.id,
                username: player.account.username,
                msg: msg
            })
        })

        socket.on('duelAccept', () => {
            const player = this.getPlayer(socket.id)
            if(!player) return

            const player2Id = this.gameManager.duelRequest.get(socket.id)
            if(!player2Id) return

            const player2 = this.getPlayer(player2Id)
            if(!player2) return

            player.scene.removePlayer(socket.id)
            player2.scene.removePlayer(player2Id)

            this.io.to(socket.id).emit('duelStart')
            this.io.to(player2Id).emit('duelStart')
            
            setTimeout(() => {
                this.gameManager.getWorld('duel')?.addPlayer(socket.id, player.account)
                this.gameManager.getWorld('duel')?.addPlayer(player2Id, player2.account)


                this.gameManager.handleInput(socket.id, {
                    dir: { x: 0, y: 0 },
                    attackDir: { x: 0, y: 0 }
                });
                this.gameManager.handleInput(player2Id, {
                    dir: { x: 0, y: 0 },
                    attackDir: { x: 0, y: 0 }
                });
            }, 100)

            this.gameManager.duelRequest.delete(socket.id)
        })

        socket.on('getQuestData', (npcId: string, callback: (quest: QuestConfig | QuestConfig[], haveOtherQuest: string, progressState: number) => void) => {
            if(typeof npcId !== 'string') return

            const player = this.getPlayer(socket.id)
            if(!player) return

            const quest = Quests.isNpcQuestRepeatable(npcId) ? Quests.getQuestsByNpcId(npcId) : Quests.getQuestByNpcId(npcId, player.account.questCompleted)
            if(!quest) return callback({
                id: '',
                npcId: '',
                name: '',
                description: '',
                reward: {
                    xp: 0
                },
                taskInstruction: '',
                task: []
            }, '', 0)

            let progressState = 0

            if(player.questInProgress && !Array.isArray(quest)){
                progressState = player.questInProgress.config.id === quest.config.id ?
                    (player.questInProgress.isComplete ? 2 : 1) : 0;
            }
            else if(Array.isArray(quest)){
                for(const q of quest){
                    if(player.questInProgress && player.questInProgress.config.id === q.config.id){
                        progressState = player.questInProgress.isComplete ? 2 : 1
                        break
                    }
                }
            }

            if(!Array.isArray(quest)) callback(quest.config, player.questInProgress?.config.id || '', progressState)
            else callback(quest.map(v => v.config), player.questInProgress?.config.id || '', progressState)
        })

        socket.on('acceptQuest', (npcId: string, questId?: string) => {
            if(typeof npcId !== 'string') return

            const player = this.getPlayer(socket.id)
            if(!player) return

            const quest = questId ? Quests.getQuestByQuestId(questId) : Quests.getQuestByNpcId(npcId, player.account.questCompleted)
            if(!quest) return

            console.log('Quest accepted:', quest.config.id)

            player.questInProgress = quest
            player.account.questInProgress = [quest.config.id, quest.taskProgress]

            quest.onProgress((taskProgress) => {
                player.account.questInProgress = [quest.config.id, taskProgress]
                socket.emit('questProgress', quest.config.taskInstruction, taskProgress.map((v, i) => {
                    return {
                        type: quest.config.task[i].type,
                        target: quest.config.task[i].target,
                        progress: v,
                        max: quest.config.task[i].amount
                    }
                }))
                console.log('Quest progress:', taskProgress) // Debugging line
            })

            quest.setTaskProgress(quest.taskProgress)

            quest.config.task.forEach(v => {
                if(v.type == 'collect'){
                    const getItem = player.inventory.getItem(v.target) as Item & { quantity: number }
                    if(player.questInProgress) {
                        player.questInProgress.addProgress('collect', v.target, getItem?.quantity || 0)
                    }
                }
            })
        })

        socket.on('declineQuest', () => {
            const player = this.getPlayer(socket.id)
            if(!player || !player.questInProgress) return

            player.questInProgress.destroy()
            player.questInProgress = null
            player.account.questInProgress = undefined

            socket.emit('questProgress', 'No instruction yet')
        })

        socket.on('completeQuest', () => {
            const player = this.getPlayer(socket.id)
            if(!player || !player.questInProgress) return

            const quest = player.questInProgress
            
            if(quest && quest.isComplete){
                const { xp = 0, item = [], gold = 0 } = quest.config.reward

                quest.config.task.forEach(v => {
                    v.type == 'collect' && player.inventory.removeItemById(v.target, v.amount)
                })

                player.account.questCompleted.push(quest.config.id);
                player.stats.addXp(xp);
                player.account.gold += gold;
                
                if(item.length > 0){
                    item.forEach(([itemName, itemQuantity]) => {
                        if(typeof itemName === 'string' && typeof itemQuantity === 'number') {
                            player.inventory.addItem(itemName, itemQuantity);
                        }
                    });
                }

                player.questInProgress.destroy()
                player.questInProgress = null
                player.account.questInProgress = undefined
                
                socket.emit('questProgress', 'No instruction yet')
            }
        })

        socket.on('changeGender', (isMale: boolean) => {
            const player = this.getPlayer(socket.id)
            if(!player) return
            if(typeof isMale !== 'boolean') return

            player.account.outfit = {
                isMale,
                color: player.account.outfit.color,
                hair: 'basic',
                face: 'basic',
                body: 'basic',
                leg: 'basic'
            }
            player.outfit = {
                isMale,
                color: player.outfit.color,
                hair: 'basic',
                face: 'basic',
                body: 'basic',
                leg: 'basic'
            }

            socket.broadcast.emit('changeGender', socket.id, isMale)
        })

        socket.on('changeOutfit', (model: string, outfit: string | number) => {
            const player = this.getPlayer(socket.id)
            if(!player) return

            if(['color', 'hair', 'face', 'body', 'leg'].indexOf(model) == -1) return
            if(model == 'color') outfit = Number(outfit)
            if(typeof outfit !== 'string' && typeof outfit !== 'number') return

            if(['hair', 'face', 'body', 'leg'].indexOf(model) > -1 && typeof outfit === 'string'){
                const key = model as 'hair' | 'face' | 'body' | 'leg'
                const genderKey = player.outfit.isMale ? 'male' : 'female'
                if(!outfitList[genderKey][key].includes(outfit)) return
            }

            player.account.outfit = {
                ...player.account.outfit,
                [model]: outfit
            }

            player.outfit = {
                ...player.outfit,
                [model]: outfit
            }

            socket.broadcast.emit('changeOutfit', socket.id, model, outfit)
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

    getIdByUsername(username: string){
        let id: string | null = null
        this.authedId.forEach((v, k) => {
            if(v == username){
                id = k
                return
            }
        })
        return id
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
