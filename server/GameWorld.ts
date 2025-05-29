import * as p from 'planck'
import { GameManager, InputData } from './GameManager'
import { ContactEvents } from './components/ContactEvents'
import { MapSetup } from './components/MapSetup'
import { Account } from './server'
import { Player } from './prefabs/Player'
import { Enemy } from './prefabs/Enemy'
import { DroppedItem } from './prefabs/DroppedItem'
import { Projectile } from './prefabs/items/RangeWeapon'

export class Game{

    id: string
    gameManager: GameManager
    isPvpAllowed: boolean

    world: p.World
    gameScale = 4
    contactEvents: ContactEvents

    players: Player[]
    enemies: Enemy[]
    droppedItems: DroppedItem[]
    projectiles: Projectile[]
    
    projectileBodys: p.Body[]
    entityBodys: p.Body[]

    inputData: Map<string, InputData[]>
    mapSetup: MapSetup

    constructor(gameManager: GameManager, id: string, isPvpAllowed: boolean){
        this.gameManager = gameManager
        this.id = id
        this.isPvpAllowed = isPvpAllowed

        this.world = new p.World()

        this.contactEvents = new ContactEvents(this.world)

        this.inputData = new Map()

        this.players = []; // { socketId: Player }
        this.enemies = [];
        this.droppedItems = [];
        this.projectiles = []

        this.projectileBodys = []
        this.entityBodys = [];

        this.mapSetup = new MapSetup(this, id)

        this.contactEvents.addEvent(this.projectileBodys, this.entityBodys, (bodyA, bodyB) => {
            const projectile = bodyA.getUserData() as Projectile 
            const parent = projectile.parentBody.getUserData()
            const target = bodyB.getUserData()

            const isPlayer = (obj: any) => obj instanceof Player
            const isEnemy = (obj: any) => obj instanceof Enemy

            const hit = () => {
                if(!isEnemy(target) && !isPlayer(target)) return;
                if (projectile.dir.length() > 0) {
                    target.health -= projectile.config.damage;
                    target.knockback = projectile.config.knockback;
                    target.knockbackDir = new p.Vec2(projectile.dir.x, projectile.dir.y);
                }
            }
            
            if(isPlayer(parent) && isPlayer(target)){
                if(target.id == parent.id) return
                if(!this.isPvpAllowed) return

                hit()
            }
            else if((isPlayer(parent) && isEnemy(target)) || (isEnemy(parent) && isPlayer(target))){
                hit()
            }
        })
    }

    update(deltaTime: number) {
        // Step physics world (fixed timestep untuk deterministik)
        this.world.step(deltaTime);
        
        // Update entitas
        this.players.forEach(player => {
            const inputData = this.inputData.get(player.id)?.splice(0)

            if(!inputData) return;
            if(inputData.length > 4) {
                this.gameManager.io.sockets.sockets.get(player.id)?.disconnect(true)
            }

            const v = inputData[0]

            const dir = new p.Vec2(v?.dir.x || 0, v?.dir.y || 0)
            const attackDir = new p.Vec2()

            if(v && (v.attackDir.x != 0 || v.attackDir.y != 0) && player.itemInstance.timestamp < Date.now()){
                attackDir.x = v.attackDir.x
                attackDir.y = v.attackDir.y
            }

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

                const items = [{ id: 'sword', name: 'Sword' }, { id: 'bow', name: 'Bow' }]
                const randomItem = items[Math.floor(Math.random()*2)]
                
                const droppedItem = new DroppedItem(this, enemyPos.x, enemyPos.y, randomItem.id, randomItem.name)
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

        this.projectiles.forEach(v => {
            v.update()
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
            }),
            projectiles: this.projectiles.map(v => {
                return {
                    uid: v.uid,
                    pos: v.pBody.getPosition(),
                    dir: v.dir,
                    config: v.config
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