import * as p from 'planck'
import { GameManager, InputData } from './GameManager'
import { ContactEvents } from './components/ContactEvents'
import { MapSetup } from './components/MapSetup'
import { Account } from './server'
import { Player } from './prefabs/Player'
import { Enemy } from './prefabs/Enemy'
import { DroppedItem } from './prefabs/DroppedItem'
import { Projectile } from './prefabs/items/RangeWeapon'
import { BaseItem } from './prefabs/BaseItem'
import { Quests } from './components/Quests'

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

    odd: boolean = false

    constructor(gameManager: GameManager, id: string, isPvpAllowed: boolean){
        this.gameManager = gameManager
        this.id = id
        this.isPvpAllowed = isPvpAllowed

        this.world = new p.World()

        this.contactEvents = new ContactEvents(this.world)

        this.inputData = new Map()

        this.players = [];
        this.enemies = [];
        this.droppedItems = [];
        this.projectiles = []

        this.projectileBodys = []
        this.entityBodys = [];

        this.mapSetup = new MapSetup(this, id)

        
        this.addHitbox(this.projectileBodys, this.entityBodys)
    }

    addHitbox(sourceBody: p.Body | p.Body[], targetBody: p.Body | p.Body[]){
        this.contactEvents.addEvent(sourceBody, targetBody, (bodyA, bodyB) => {
            const weapon = bodyA.getUserData() as BaseItem | Projectile
            const parent = weapon.parentBody.getUserData() 
            const target = bodyB.getUserData()

            const isPlayer = (obj: any) => obj instanceof Player
            const isEnemy = (obj: any) => obj instanceof Enemy

            const hit = () => {
                if(!isEnemy(target) && !isPlayer(target)) return;
                if (weapon.attackDir.length() > 0) {
                    target.health -= weapon.damage;
                    target.knockback = weapon.knockback;
                    target.knockbackDir = new p.Vec2(weapon.attackDir.x, weapon.attackDir.y);
                }
            }
            
            if(isPlayer(parent) && isPlayer(target)){
                if(target.uid == parent.uid) return
                if(!this.isPvpAllowed) return

                hit()
            }
            else if((isPlayer(parent) && isEnemy(target)) || (isEnemy(parent) && isPlayer(target))){
                hit()
                if(isEnemy(target) && isPlayer(parent)){
                    if(!target.attacker.includes(parent)){
                        target.attacker.push(parent)
                    }
                }
            }
        })
    }

    update(deltaTime: number) {
        this.world.step(deltaTime);
        
        // Update entitas
        this.players.forEach(player => {
            const inputData = this.inputData.get(player.uid)?.splice(0, this.inputData.get(player.uid)?.length!-1 || 2)

            if(!inputData) return;
            // if(inputData.length > 20) {
            //     this.gameManager.io.sockets.sockets.get(player.id)?.disconnect(true)
            // }

            const dir = new p.Vec2()
            const attackDir = new p.Vec2()

            inputData?.forEach(v => {
                const idir = new p.Vec2(v.dir.x, v.dir.y)

                if((v.attackDir.x != 0 || v.attackDir.y != 0) && player.itemInstance.timestamp < Date.now()){
                    attackDir.x = v.attackDir.x
                    attackDir.y = v.attackDir.y
                }

                dir.x += idir.x
                dir.y += idir.y
            }) 

            dir.normalize()
            dir.mul(player.speed)

            if(dir) player.pBody.setLinearVelocity(dir)
            if(attackDir && player.itemInstance.canUse()) player.attackDir = attackDir
        });

        this.broadcastOutput()

        this.players.forEach(player => {
            if(player.health <= 0){
                player.account.health = 100
                this.removePlayer(player.uid)
            }
            else player.update()
        })

        this.enemies.forEach(enemy => {
            if(enemy.health <= 0){
                const enemyPos = enemy.pBody.getPosition()
                const { x, y } = enemy.defaultPos.clone()

                this.entityBodys.splice(this.entityBodys.indexOf(enemy.pBody), 1)
                this.enemies.splice(this.enemies.indexOf(enemy), 1)
                enemy.destroy()

                const droppedItem = new DroppedItem(this, enemyPos.x, enemyPos.y, 'wood')
                this.droppedItems.push(droppedItem)

                enemy.attacker.forEach(player => {
                    player.account.xp += 1
                    player.questInProgress?.addProgress('kill', enemy.id)
                })

                setTimeout(() => {
                    const newEnemy = new Enemy(this, x*this.gameScale*32, y*this.gameScale*32, enemy.id)
                    this.entityBodys.push(newEnemy.pBody)
                    this.enemies.push(newEnemy)
                }, 5000)
            }
            else enemy.update()
        })

        this.projectiles.forEach(v => {
            v.update()
        })

        this.droppedItems.sort((a) => a.isActive ? 1 : -1);
        this.droppedItems.slice().reverse().forEach(v =>{
            if(!v.isActive){
                this.droppedItems.splice(this.droppedItems.indexOf(v), 1)
                v.destroy()
            }
        })
    }

    broadcastOutput(){
        const gameState = {
            id: this.id,
            players: this.players.map(v => {
                return {
                    uid: v.uid,
                    pos: v.pBody.getPosition(),
                    attackDir: v.attackDir,
                    health: v.health,
                    timestamp: Date.now(),
                    xp: v.account.xp
                }
            }),
            enemies: this.enemies.map(v => {
                return {
                    uid: v.uid,
                    pos: v.pBody.getPosition(),
                    attackDir: v.attackDir,
                    health: v.health
                }
            }),
            droppedItems: this.droppedItems.map(v => {
                return {
                    uid: v.uid,
                    id: v.id,
                    pos: v.pBody.getPosition(),
                    quantity: v.quantity
                }
            }),
            projectiles: this.projectiles.map(v => {
                return {
                    uid: v.uid,
                    pos: v.pBody.getPosition(),
                    dir: v.attackDir,
                    config: v.config
                }
            })
        }

        this.gameManager.io.to(this.id).emit('output', gameState)
    }

    addPlayer(uid: string, account: Account, from?: string){
        const enterPos = this.mapSetup.enterpoint.get(from || 'spawn') || { x: 100, y: 100 }

        const player = new Player(this, enterPos.x, enterPos.y, uid, account)

        if(account.questInProgress){
            const npcId = account.questInProgress[0]
            const quest = Quests.getQuestByNpcId(npcId, account.questCompleted)
            player.questInProgress = quest
            
            if(player.questInProgress && quest){
                quest.onProgress((taskProgress) => {
                    player.account.questInProgress = [npcId, taskProgress]
                    socket?.emit('questProgress', quest.config.taskInstruction, taskProgress.map((v, i) => {
                        return {
                            type: quest.config.task[i].type,
                            target: quest.config.task[i].target,
                            progress: v,
                            max: quest.config.task[i].amount
                        }
                    }))
                })
            }
        }

        this.entityBodys.push(player.pBody)
        this.players.push(player)

        const socket = this.gameManager.io.sockets.sockets.get(uid)

        this.gameManager.playerMap.set(uid, this.id);
        socket?.join(this.id);

        socket?.emit('joinGame', account, this.players.map(v => {
            return {
                uid: v.uid,
                username: v.account.username,
                items: v.inventory.items,
                activeIndex: v.inventory.activeIndex,
                pos: v.pBody.getPosition(),
                health: v.health
            }
        }))
        socket?.broadcast.to(this.id).emit('playerJoined', {
            uid: socket.id,
            username: account.username,
            items: account.inventory,
            from: from || 'spawn',
            health: account.health
        });


        if(account.questInProgress) player.questInProgress?.setTaskProgress(account.questInProgress[1])

        console.log('Player '+uid+' has added to '+this.id)
    }

    removePlayer(uid: string){
        const existPlayer = this.players.find(player => player.uid == uid)

        if(!existPlayer) return

        this.gameManager.playerMap.delete(uid);

        this.players.splice(this.players.indexOf(existPlayer), 1)
        this.entityBodys.splice(this.entityBodys.indexOf(existPlayer.pBody), 1)

        existPlayer.destroy()

        this.gameManager.io.to(this.id).emit('playerLeft', uid);
        
        const socket = this.gameManager.io.sockets.sockets.get(uid)
        socket?.leave(this.id)
        
        console.log('Player '+uid+' has removed from '+this.id)
    }

    playerDropItem(uid: string, index: number, dir: { x: number, y: number }, quantity?: number){
        const player = this.players.find(v => v.uid == uid)
        if(!player) return

        const item = player.inventory.items[index]
        if(player.inventory.removeItem(index, quantity || 1)){
            const pos = player.pBody.getPosition().clone()
            const newDir = new p.Vec2(dir.x, dir.y)
            newDir.normalize()
            pos.add(newDir)

            const droppedItem = new DroppedItem(this, pos.x, pos.y, item.id, quantity)
            this.droppedItems.push(droppedItem)
        }
    }
}