import * as p from 'planck'
import { GameManager, InputData } from './GameManager'
import { ContactEvents } from './components/ContactEvents'
import { MapSetup } from './components/MapSetup'
import { Account } from './server'
import { Player } from './prefabs/Player'
import { Enemy } from './prefabs/Enemy'

export class Game{

    id: string
    gameManager: GameManager

    world: p.World
    gameScale = 4
    contactEvents: ContactEvents

    players: Player[]
    enemies: Enemy[]

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
        
        this.entityBodys = [];

        this.mapSetup = new MapSetup(this, 'test')
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
                const { x, y } = enemy.defaultPos.clone()
                const id = enemy.id

                this.entityBodys.splice(this.entityBodys.indexOf(enemy.pBody), 1)
                this.enemies.splice(this.enemies.indexOf(enemy), 1)
                enemy.destroy()

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
            })
        }

        this.gameManager.io.emit('output', gameState)
    }

    addPlayer(id: string, account: Account){
        const player = new Player(this, 700, 800, id, account)
        player.inventory.updateInventory(account.inventory)
        
        player.account.inventory = player.inventory.items

        this.entityBodys.push(player.pBody)
        this.players.push(player)

        this.gameManager.playerMap.set(id, this.id);

        console.log('Player '+id+' has added to game')
    }

    removePlayer(id: string){
        const existPlayer = this.players.find(player => player.id == id)

        if(!existPlayer) return

        this.gameManager.playerMap.delete(id);

        this.players.splice(this.players.indexOf(existPlayer), 1)
        this.entityBodys.splice(this.entityBodys.indexOf(existPlayer.pBody), 1)

        existPlayer.destroy()
    }
}