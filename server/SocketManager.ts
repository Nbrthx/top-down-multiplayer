import { Server, Socket } from 'socket.io';
import { GameManager, InputData } from './GameManager';
import { Server as HTTPServer } from 'http'
import { Account, Item } from './server';
import { QuestConfig, Quests } from './components/Quests';
import { male, female } from './json/.outfit-list.json';

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

const outfitList: OutfitList = { male, female }

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

        socket.on('joinGame', this.joinGame.bind(this, socket));

        socket.on('confirmChangeWorld', this.confirmChangeWorld.bind(this, socket));

        socket.on('playerInput', this.playerInput.bind(this, socket));

        socket.on('swapInventory', this.swapInventory.bind(this, socket));

        socket.on('setHotbarIndex', this.setHotbarIndex.bind(this, socket));

        socket.on('dropItem', this.dropItem.bind(this, socket));

        socket.on('getQuestData', this.getQuestData.bind(this, socket));

        socket.on('acceptQuest', this.acceptQuest.bind(this, socket));

        socket.on('declineQuest', this.declineQuest.bind(this, socket));

        socket.on('completeQuest', this.completeQuest.bind(this, socket));

        socket.on('changeGender', this.changeGender.bind(this, socket));

        socket.on('changeOutfit', this.changeOutfit.bind(this, socket));

        socket.on('wrapOutfit', this.wrapOutfit.bind(this, socket));

        socket.on('chat', this.chat.bind(this, socket));

        socket.on('duelAccept', this.duelAccept.bind(this, socket));

        socket.on('tradeAccept', this.tradeAccept.bind(this, socket));

        socket.on('tradeDecline', this.tradeDecline.bind(this, socket));

        socket.on('addTradeItem', this.addTradeItem.bind(this, socket));

        socket.on('dealTrade', this.dealTrade.bind(this, socket));

        socket.on('finishTrade', this.finishTrade.bind(this, socket));

        socket.on('ping', (callback) => {
            callback()
        })

        socket.on('disconnect', () => {
            const tradeSession = this.gameManager.tradeSession.find(v => v.player1 == socket.id || v.player2 == socket.id)
            if(tradeSession){
                this.io.to(tradeSession.player1).emit('tradeEnd')
                this.io.to(tradeSession.player2).emit('tradeEnd')
                this.gameManager.tradeSession.splice(this.gameManager.tradeSession.indexOf(tradeSession), 1)
            }

            this.gameManager.getPlayerWorld(socket.id)?.removePlayer(socket.id);
            this.removeAuthedId(socket.id)
        });
    }


    joinGame(socket: Socket) {
        const account = this.getAccountData(socket.id)
        if(!account) return

        const world = this.gameManager.getWorld('map1')
        world?.addPlayer(socket.id, account);
    }

    confirmChangeWorld(socket: Socket){
        const player = this.getPlayer(socket.id)
        if(!player) return

        const worldId = this.gameManager.playerChangeWorld.get(socket.id)
        if(!worldId) return

        const world = this.gameManager.getWorld(worldId)
        if(!world) return

        if(player.stats.getLevel() < world.config.requiredLevel) return

        player.scene.removePlayer(socket.id)
        world.addPlayer(socket.id, player.account, player.scene.id.split(':')[0] == 'duel' ? 'spawn' : player.scene.id)

        this.gameManager.playerChangeWorld.delete(socket.id)
    }

    playerInput(socket: Socket, input: InputData) {
        if(!input) return
        if(typeof input.dir.x !== 'number' && typeof input.dir.y !== 'number') return
        if(typeof input.attackDir.x !== 'number' && typeof input.attackDir.y !== 'number') return

        this.gameManager.handleInput(socket.id, input);
    }

    swapInventory(socket: Socket, swap: {
        index: number,
        index2: number
    }){
        if(!Number.isInteger(swap.index) && !Number.isInteger(swap.index2)) return

        const world = this.gameManager.getPlayerWorld(socket.id)
        if(!world) return

        const player = world.players.find(v => v.uid == socket.id)
        if(!player) return

        player.inventory.swapItem(swap.index, swap.index2)

        socket.emit('updateInventory', player.inventory.items)
        socket.broadcast.to(world.id).emit('otherUpdateInventory', socket.id, player.inventory.items)
    }

    setHotbarIndex(socket: Socket, index: number) {
        if(!Number.isInteger(index)) return

        const player = this.getPlayer(socket.id)
        if(!player) return

        player.inventory.setActiveIndex(index)
        socket.broadcast.to(player.scene.id).emit('otherUpdateHotbar', socket.id, index)
    }

    dropItem(socket: Socket, index: number, dir: { x: number, y: number }, quantity?: number) {
        if(!Number.isInteger(index) && typeof dir.x !== 'number' && typeof dir.y !== 'number') return
        if(this.gameManager.tradeSession.find(v => v.player1 == socket.id || v.player2 == socket.id)) return

        const world = this.gameManager.getPlayerWorld(socket.id)
        if(!world) return

        world.playerDropItem(socket.id, index, dir, quantity)
    }

    getQuestData(socket: Socket, npcId: string, callback: (quest: QuestConfig | QuestConfig[], haveOtherQuest: string, progressState: number) => void) {
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
    }

    acceptQuest(socket: Socket, npcId: string, questId?: string) {
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
    }

    declineQuest(socket: Socket){
        const player = this.getPlayer(socket.id)
        if(!player || !player.questInProgress) return

        player.questInProgress.destroy()
        player.questInProgress = null
        player.account.questInProgress = undefined

        socket.emit('questProgress', 'No instruction yet')
    }

    completeQuest(socket: Socket) {
        const player = this.getPlayer(socket.id)
        if(!player || !player.questInProgress) return

        const quest = player.questInProgress
        
        if(quest && quest.isComplete){
            const { xp = 0, item = [] } = quest.config.reward

            quest.config.task.forEach(v => {
                v.type == 'collect' && player.inventory.removeItemById(v.target, v.amount)
            })

            player.account.questCompleted.push(quest.config.id);
            player.stats.addXp(xp);
            
            if(item.length > 0){
                item.forEach(([itemName, itemQuantity]) => {
                    if(typeof itemName === 'string' && typeof itemQuantity === 'number') {
                        player.inventory.addItem({
                            id: itemName,
                            quantity: itemQuantity,
                            timestamp: Date.now()
                        });
                    }
                });
            }

            player.questInProgress.destroy()
            player.questInProgress = null
            player.account.questInProgress = undefined
            
            socket.emit('questProgress', 'No instruction yet')
        }
    }

    changeGender(socket: Socket, isMale: boolean) {
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
    }

    changeOutfit(socket: Socket, model: string, outfit: string | number) {
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

        if(typeof outfit == 'string' && model != 'color'){
            if(!player.account.ownedOutfits.includes(outfit+'-'+model+'-'+(player.outfit.isMale ? 'male' : 'female'))) return
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
    }

    wrapOutfit(socket: Socket, model: string, outfit: string) {
        const player = this.getPlayer(socket.id)
        if(!player) return

        if(['hair', 'face', 'body', 'leg'].indexOf(model) == -1) return
        if(typeof outfit !== 'string') return

        player.inventory.addItem({
            id: 'wrapped-'+model+':'+outfit+'-'+(player.outfit.isMale ? 'male' : 'female'),
            quantity: 1,
            timestamp: Date.now()
        })
        player.account.ownedOutfits.splice(player.account.ownedOutfits.indexOf(outfit+'-'+model+'-'+(player.outfit.isMale ? 'male' : 'female')), 1)

        socket.emit('changeOwnedOutfits', player.account.ownedOutfits)
    }

    chat(socket: Socket, msg: string){
        if(typeof msg !== 'string' || msg.length > 64) return

        const player = this.getPlayer(socket.id)
        if(!player) return

        const command = msg.split(' ')
        if(command[0] == '/duel') {
            const player2Id = this.getIdByUsername(command[1])
            if(!player2Id) return socket.emit('serverMessage', 'Player not found')
            if(player2Id == player.uid) return socket.emit('serverMessage', 'You cannot duel with yourself')
            if(this.getPlayer(player2Id)?.scene.id != player.scene.id) return socket.emit('serverMessage', 'Player not in the same world')

            const player2 = this.getPlayer(player2Id)
            if(!player2) return socket.emit('serverMessage', 'Player not found')

            this.gameManager.duelRequest.set(player2.uid, player.uid)

            setTimeout(() => {
                this.gameManager.duelRequest.delete(player2.uid)
            }, 30000)

            socket.emit('serverMessage', 'Duel request sent to '+player2.account.username)
            this.io.to(player2.uid).emit('duelRequest', player.account.username, player.stats.getLevel())
            return
        }
        else if(command[0] == '/trade') {
            const player2Id = this.getIdByUsername(command[1])
            if(!player2Id) return socket.emit('serverMessage', 'Player not found')
            if(player2Id == player.uid) return socket.emit('serverMessage', 'You cannot trade with yourself')
            if(this.getPlayer(player2Id)?.scene.id != player.scene.id) return socket.emit('serverMessage', 'Player not in the same world')

            const player2 = this.getPlayer(player2Id)
            if(!player2) return socket.emit('serverMessage', 'Player not found')

            if(this.gameManager.tradeSession.find(v => v.player1 == player.uid || v.player2 == player.uid)) return socket.emit('serverMessage', 'Trade already in progress')
            if(this.gameManager.tradeSession.find(v => v.player1 == player2.uid || v.player2 == player2.uid)) return socket.emit('serverMessage', 'Other player is in trade session')

            this.gameManager.tradeRequest.set(player2.uid, player.uid)

            setTimeout(() => {
                this.gameManager.tradeRequest.delete(player2.uid)
            }, 30000)

            socket.emit('serverMessage', 'Trade request sent to '+player2.account.username)
            this.io.to(player2.uid).emit('tradeRequest', player.account.username)
            return
        }

        if(msg[0] == '/') return

        this.io.to(player.scene.id).emit('chat', {
            uid: socket.id,
            username: player.account.username,
            msg: msg
        })
    }

    duelAccept(socket: Socket) {
        const player = this.getPlayer(socket.id)
        if(!player) return

        const player2Id = this.gameManager.duelRequest.get(socket.id)
        if(!player2Id) return socket.emit('serverMessage', 'Duel request not found or expired')

        const player2 = this.getPlayer(player2Id)
        if(!player2) return socket.emit('serverMessage', 'Player not found')

        player.scene.removePlayer(socket.id)
        player2.scene.removePlayer(player2Id)

        this.gameManager.createWorld('duel:'+player.uid+player2.uid, {
            mapId: 'duel',
            isPvpAllowed: true,
            requiredLevel: 0,
            isDestroyable: true
        })

        this.io.to(socket.id).emit('duelStart', 'duel:'+player.uid+player2.uid)
        this.io.to(player2Id).emit('duelStart', 'duel:'+player.uid+player2.uid)
        
        setTimeout(() => {
            this.gameManager.getWorld('duel:'+player.uid+player2.uid)?.addPlayer(socket.id, player.account)
            this.gameManager.getWorld('duel:'+player.uid+player2.uid)?.addPlayer(player2Id, player2.account)

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
    }

    tradeAccept(socket: Socket) {
        const player = this.getPlayer(socket.id)
        if(!player) return

        const player2Id = this.gameManager.tradeRequest.get(socket.id)
        if(!player2Id) return socket.emit('serverMessage', 'Trade request not found or expired')

        const player2 = this.getPlayer(player2Id)
        if(!player2) return socket.emit('serverMessage', 'Player not found')

        this.io.to(socket.id).emit('tradeStart', player2Id)
        this.io.to(player2Id).emit('tradeStart', socket.id)

        this.gameManager.tradeRequest.delete(socket.id)
        this.gameManager.tradeSession.push({
            player1: socket.id,
            player2: player2Id,
            item1: [],
            item2: [],
            state: false,
            timestamp: Date.now()
        })
    }

    addTradeItem(socket: Socket, selectedIndex: number, index: number, itemCount?: number) {
        const tradeSession = this.gameManager.tradeSession.find(v => v.player1 == socket.id || v.player2 == socket.id)
        if(!tradeSession) return socket.emit('serverMessage', 'Trade session not found')

        const player = this.getPlayer(tradeSession.player1 == socket.id ? tradeSession.player1 : tradeSession.player2)
        if(!player) return socket.emit('serverMessage', 'Player not found')

        const item = player.inventory.items[index]
        if(!item) return
        if(itemCount && itemCount > item.quantity) return

        const addedItem = tradeSession.player1 == socket.id ? tradeSession.item1 : tradeSession.item2
        
        if(!addedItem[selectedIndex]) addedItem[selectedIndex] = {
            id: item.id,
            quantity: itemCount ? itemCount : 1
        }
        else addedItem[selectedIndex] = null

        const itemId = addedItem[selectedIndex] ? item.id : ''

        socket.emit('addTradeItem', selectedIndex, itemId, true, itemCount)
        socket.to(tradeSession.player1 == socket.id ? tradeSession.player2 : tradeSession.player1).emit('addTradeItem', selectedIndex, itemId, false, itemCount)
    }

    tradeDecline(socket: Socket) {
        const tradeSession = this.gameManager.tradeSession.find(v => v.player1 == socket.id || v.player2 == socket.id)
        if(tradeSession){
            this.io.to(tradeSession.player1).emit('tradeEnd')
            this.io.to(tradeSession.player2).emit('tradeEnd')
            this.gameManager.tradeSession.splice(this.gameManager.tradeSession.indexOf(tradeSession), 1)
        }
    }

    dealTrade(socket: Socket) {
        const tradeSession = this.gameManager.tradeSession.find(v => v.player1 == socket.id || v.player2 == socket.id)
        if(tradeSession){
            tradeSession.state = true
            const otherId = tradeSession.player1 == socket.id ? tradeSession.player2 : tradeSession.player1
            this.io.to(otherId).emit('dealTrade')
        }
    }

    finishTrade(socket: Socket) {
        const tradeSession = this.gameManager.tradeSession.find(v => v.player1 == socket.id || v.player2 == socket.id)
        if(tradeSession){
            if(!tradeSession.state) return socket.emit('serverMessage', 'Other player change deal')

            const player1 = this.getPlayer(tradeSession.player1)
            const player2 = this.getPlayer(tradeSession.player2)

            if(!player1 || !player2) return

            tradeSession.item1.forEach((v) => {
                if(!v) return

                player2.inventory.addItem({ id: v.id, quantity: v.quantity, timestamp: Date.now() })
                player1.inventory.removeItemById(v.id, v.quantity)
            })
            tradeSession.item2.forEach((v) => {
                if(!v) return

                player1.inventory.addItem({ id: v.id, quantity: v.quantity, timestamp: Date.now() })
                player2.inventory.removeItemById(v.id, v.quantity)
            })

            this.io.to(tradeSession.player1).emit('tradeEnd')
            this.io.to(tradeSession.player2).emit('tradeEnd')
            this.gameManager.tradeSession.splice(this.gameManager.tradeSession.indexOf(tradeSession), 1)
        }    
    }

    // Not Listener

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
        if(!this.authedId.has(id)) return
        this.authedId.delete(id)
    }
}
