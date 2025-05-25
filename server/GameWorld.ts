import * as p from 'planck'
import { GameManager, InputData } from './GameManager'
import { ContactEvents } from './components/ContactEvents'
import { MapSetup } from './components/MapSetup'
import { Account } from './server'
import { Player } from './prefabs/Player'
import { Enemy } from './prefabs/Enemy'
import { DroppedItem } from './prefabs/DroppedItem'

export class Game{

    id: string
    gameManager: GameManager

    world: p.World
    gameScale = 4
    contactEvents: ContactEvents

    players: Player[]
    enemies: Enemy[]
    droppedItems: DroppedItem[]

    entityBodys: p.Body[]

    inputData: Map<string, InputData[]>
    mapSetup: MapSetup

    constructor(gameManager: GameManager, id: string){
        this.gameManager = gameManager
        this.id = id
        this.world = new p.World()

        this.contactEvents = new ContactEvents(this.world)

        this.inputData = new Map()

        this.players = []; // { socketId: Player }
        this.enemies = [];
        this.droppedItems = [];
        
        this.entityBodys = [];

        this.mapSetup = new MapSetup(this, id)
    }

    update(deltaTime: number) {
        // Step physics world (fixed timestep untuk deterministik)
        this.world.step(deltaTime);
        
        // Update entitas
        this.players.forEach(player => {
            const inputData = this.inputData.get(player.id)?.splice(0)

            const dir = new p.Vec2()
            const attackDir = new p.Vec2()

            inputData?.forEach(v => {
                const idir = new p.Vec2(v.dir.x, v.dir.y)
                idir.normalize()

                if((v.attackDir.x != 0 || v.attackDir.y != 0) && player.itemInstance.timestamp < Date.now()){
                    attackDir.x = v.attackDir.x
                    attackDir.y = v.attackDir.y
                }

                dir.x += idir.x
                dir.y += idir.y
            })

            dir.mul(player.speed)

            if(dir) player.pBody.setLinearVelocity(dir)
            if(attackDir) player.attackDir = attackDir
        });

        this.broadcastOutput()

        this.players.forEach(player => {
            if(player.health <= 0){
                this.removePlayer(player.id)
            }
            else player.update()
        })

        this.enemies.forEach(enemy => {
            if(enemy.health <= 0){
                const enemyPos = enemy.pBody.getPosition()
                const { x, y } = enemy.defaultPos.clone()
                const id = enemy.id

                this.entityBodys.splice(this.entityBodys.indexOf(enemy.pBody), 1)
                this.enemies.splice(this.enemies.indexOf(enemy), 1)
                enemy.destroy()
                
                const droppedItem = new DroppedItem(this, enemyPos.x, enemyPos.y, 'sword', 'Sword')
                this.droppedItems.push(droppedItem)
                droppedItem.onDestroy = () => this.droppedItems.splice(this.droppedItems.indexOf(droppedItem), 1)

                setTimeout(() => {
                    const newEnemy = new Enemy(this, x*this.gameScale*32, y*this.gameScale*32, id)
                    this.entityBodys.push(newEnemy.pBody)
                    this.enemies.push(newEnemy)
                }, 5000)
            }
            else enemy.update()
        })
    }

    broadcastOutput(){
        const gameState = {
            players: this.players.map(v => {
                return {
                    id: v.id,
                    worldId: this.id,
                    pos: v.pBody.getPosition(),
                    attackDir: v.attackDir,
                    health: v.health
                }
            }),
            enemies: this.enemies.map(v => {
                return {
                    id: v.id,
                    worldId: this.id,
                    pos: v.pBody.getPosition(),
                    attackDir: v.attackDir,
                    health: v.health
                }
            }),
            droppedItems: this.droppedItems.map(v => {
                return {
                    uid: v.uid,
                    id: v.id,
                    name: v.name,
                    worldId: this.id,
                    pos: v.pBody.getPosition(),
                }
            })
        }

        this.gameManager.io.to(this.id).emit('output', gameState)
    }

    addPlayer(id: string, account: Account, from?: string){
        const enterPos = this.mapSetup.enterpoint.get(from || 'spawn') || { x: 100, y: 100 }
        const player = new Player(this, enterPos.x, enterPos.y, id, account)
        player.inventory.updateInventory(account.inventory)
        
        player.account.inventory = player.inventory.items

        this.entityBodys.push(player.pBody)
        this.players.push(player)

        const socket = this.gameManager.io.sockets.sockets.get(id)

        this.gameManager.playerMap.set(id, this.id);
        socket?.join(this.id)

        socket?.emit('joinGame', account, this.players.map(v => {
            return {
                id: v.id,
                username: v.account.username,
                items: v.inventory.items,
                activeIndex: v.inventory.activeIndex,
                pos: v.pBody.getPosition()
            }
        }))
        socket?.broadcast.to(this.id).emit('playerJoined', {
            id: socket.id,
            username: account.username,
            items: account.inventory,
            from: from || 'spawn'
        });

        console.log('Player '+id+' has added to '+this.id)
    }

    removePlayer(id: string){
        const existPlayer = this.players.find(player => player.id == id)

        if(!existPlayer) return

        this.gameManager.playerMap.delete(id);

        this.players.splice(this.players.indexOf(existPlayer), 1)
        this.entityBodys.splice(this.entityBodys.indexOf(existPlayer.pBody), 1)

        existPlayer.destroy()

        this.gameManager.io.to(this.id).emit('playerLeft', id);
        
        const socket = this.gameManager.io.sockets.sockets.get(id)
        socket?.leave(this.id)
        
        console.log('Player '+id+' has removed from '+this.id)
    }
}